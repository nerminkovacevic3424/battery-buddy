package expo.modules.batteryalarm

import android.content.Context
import android.os.SystemClock
import org.json.JSONObject
import java.time.LocalDate
import java.util.concurrent.Executors

/** A separate namespace in the existing preferences; never rewrites alarm keys. */
internal object BuddyStore {
  private val lock = Any()
  private val observations = Executors.newSingleThreadExecutor()
  private var safeStartedAt: Long? = null
  private var monitoring = false
  private var priorPlugged: Boolean? = null

  // Economy disk writes must never hold up an alarm receiver on the UI thread.
  fun beginMonitoring() { observations.execute { startMonitoring() } }
  fun endMonitoring(c: Context) {
    val application = c.applicationContext
    observations.execute { runCatching { stopMonitoring(application); AlarmStore.emit(application) } }
  }
  fun record(c: Context, level: Int, plugged: Boolean) {
    val application = c.applicationContext
    observations.execute {
      runCatching {
        val before = revision(application)
        observe(application, level, plugged)
        if (revision(application) != before) AlarmStore.emit(application)
      }
    }
  }

  fun startMonitoring() = synchronized(lock) {
    monitoring = true
    // A new service cannot certify what happened while it was absent.
    safeStartedAt = null
  }
  fun stopMonitoring(c: Context) = synchronized(lock) {
    monitoring = false; safeStartedAt = null
    val facts = readFacts(c)
    facts.put("safeDays", 0)
    saveFacts(c, facts)
  }
  private fun readFacts(c: Context): JSONObject =
    JSONObject(AlarmStore.prefs(c).getString("buddy-facts", "{}") ?: "{}")
  private fun saveFacts(c: Context, facts: JSONObject) {
    val p = AlarmStore.prefs(c)
    val serialized = facts.toString()
    if (p.getString("buddy-facts", null) != serialized) {
      p.edit().putString("buddy-facts", serialized).putInt("buddy-revision", p.getInt("buddy-revision", 0) + 1).apply()
    }
  }
  fun observe(c: Context, level: Int, plugged: Boolean) = synchronized(lock) {
    if (level !in 0..100) {
      safeStartedAt = null; priorPlugged = null
      saveFacts(c, readFacts(c).put("safeDays", 0))
      return@synchronized
    }
    val f = readFacts(c)
    val connected = priorPlugged == false && plugged
    priorPlugged = plugged
    val today = LocalDate.now().toEpochDay()
    var peak = maxOf(f.optInt("sessionPeak", level), level)
    var armed = f.optBoolean("chargeArmed", true)
    if (BuddyObservationPolicy.rearm(level, plugged, peak)) armed = true
    if (connected) {
      if (level < 10) f.put("firstRescue", true)
      if (BuddyObservationPolicy.earlyCharge(level, true, armed, today, f.optLong("lastCareDay", -1))) {
        f.put("careCount", f.optInt("careCount", 0) + 1).put("lastCareDay", today)
      }
      // Every real connection consumes this discharge session, even without a reward.
      armed = false; peak = level
    }
    f.put("chargeArmed", armed).put("sessionPeak", peak)
    if (!monitoring || level < 5) safeStartedAt = null
    else if (safeStartedAt == null) safeStartedAt = SystemClock.elapsedRealtime()
    val days = safeStartedAt?.let { ((SystemClock.elapsedRealtime() - it) / 86400000L).toInt() } ?: 0
    f.put("safeDays", days)
    if (days >= 30) f.put("survivor", true)
    saveFacts(c, f)
  }
  fun read(c: Context): Map<String, Any?> = synchronized(lock) {
    val p = AlarmStore.prefs(c)
    mapOf("revision" to p.getInt("buddy-revision", 0), "state" to p.getString("buddy-state", null), "facts" to (p.getString("buddy-facts", "{}") ?: "{}"))
  }
  fun revision(c: Context): Int = AlarmStore.prefs(c).getInt("buddy-revision", 0)
  fun commit(c: Context, expected: Int, state: String): Boolean = synchronized(lock) {
    require(state.length < 1000000) { "Buddy save is too large." }
    require(JSONObject(state).optInt("version") == 1) { "Unsupported Buddy save version." }
    val p = AlarmStore.prefs(c)
    if (p.getInt("buddy-revision", 0) != expected) return@synchronized false
    val written = p.edit().putString("buddy-state", state).putInt("buddy-revision", expected + 1).commit()
    check(written) { "Could not save Buddy. Please check available storage." }
    true
  }
}
