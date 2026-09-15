package expo.modules.batteryalarm

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager

internal object AlarmStore {
  const val EVENT = "expo.modules.batteryalarm.CHANGED"
  fun prefs(c: Context) = c.getSharedPreferences("battery-buddy", Context.MODE_PRIVATE)
  fun battery(c: Context): Pair<Int, Boolean> {
    val i = c.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    val level = i?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
    val scale = i?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
    val percent = if (level >= 0 && scale > 0) (level * 100 / scale).coerceIn(0, 100) else -1
    val plugged = (i?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) ?: -1) != 0
    return Pair(percent, plugged)
  }
  fun snapshot(c: Context): Map<String, Any?> {
    val p = prefs(c)
    val (level, plugged) = battery(c)
    return mapOf("level" to level, "plugged" to plugged,
      "enabled" to p.getBoolean("enabled", false), "running" to BatteryAlarmService.running,
      "ringing" to BatteryAlarmService.ringing, "threshold" to p.getInt("threshold", 20),
      "sound" to p.getString("sound", "cry"), "customName" to p.getString("customName", null),
      "error" to BatteryAlarmService.error, "buddyRevision" to BuddyStore.revision(c), "chargingSound" to p.getBoolean("chargingSound", true))
  }
  fun emit(c: Context) { c.sendBroadcast(Intent(EVENT).setPackage(c.packageName)) }
}
