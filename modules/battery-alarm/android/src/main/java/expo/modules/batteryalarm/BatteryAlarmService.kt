package expo.modules.batteryalarm

import android.app.*
import android.content.*
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

class BatteryAlarmService : Service() {
  companion object {
    @Volatile var running = false
    @Volatile var ringing = false
    @Volatile var error: String? = null
    const val STOP = "stop"
    const val REFRESH = "refresh"
    private const val CHANNEL = "battery-monitor"
    private const val ID = 412
  }
  private lateinit var audio: AlarmAudio
  private var registered = false
  private var currentSound: String? = null
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
      // Stop synchronously on power connection; do not wait for a JS tick or a new percentage.
      if (i.action == Intent.ACTION_POWER_CONNECTED) {
        stopAudio(); updateNotification("Plugged in · your buddy is happy")
        ChargingCue.update(c, true)
        val (level, _) = AlarmStore.battery(c)
        BuddyStore.record(c, level, true)
        AlarmStore.emit(c)
      } else reconcile()
    }
  }
  override fun onCreate() {
    super.onCreate()
    audio = AlarmAudio(this)
    BuddyStore.beginMonitoring()
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL, "Battery monitoring", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Visible while Battery Buddy watches your battery"; setSound(null, null)
    })
  }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == STOP || !AlarmStore.prefs(this).getBoolean("enabled", false)) {
      AlarmStore.prefs(this).edit().putBoolean("enabled", false).apply()
      stopAudio(); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); AlarmStore.emit(this)
      return START_NOT_STICKY
    }
    try {
      val n = notification("Watching your battery")
      if (Build.VERSION.SDK_INT >= 34) startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      else startForeground(ID, n)
      running = true
      // A custom file may have been replaced while retaining the same sound ID.
      if (intent?.action == REFRESH) stopAudio()
      if (!registered) {
        val filter = IntentFilter().apply {
          addAction(Intent.ACTION_BATTERY_CHANGED); addAction(Intent.ACTION_POWER_CONNECTED); addAction(Intent.ACTION_POWER_DISCONNECTED)
        }
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else registerReceiver(receiver, filter)
        registered = true
      }
      reconcile()
    } catch (e: Exception) {
      error = "Monitoring could not start: ${e.localizedMessage}"
      AlarmStore.prefs(this).edit().putBoolean("enabled", false).apply()
      stopAudio(); stopSelf(); AlarmStore.emit(this)
      return START_NOT_STICKY
    }
    return START_STICKY
  }
  private fun reconcile() {
    val p = AlarmStore.prefs(this)
    val (level, plugged) = AlarmStore.battery(this)
    val threshold = p.getInt("threshold", 20)
    val sound = p.getString("sound", "cry") ?: "cry"
    val shouldRing = AlarmPolicy.shouldRing(p.getBoolean("enabled", false), level, threshold, plugged)
    if (!shouldRing) { stopAudio(); error = null }
    else if (!ringing || currentSound != sound) {
      stopAudio(); ringing = true; currentSound = sound; error = null
      audio.play(sound, true) { message ->
        ringing = false; error = message
        updateNotification("Sound unavailable · open Battery Buddy"); AlarmStore.emit(this)
      }
    }
    updateNotification(when {
      error != null -> "Sound unavailable · open Battery Buddy"
      plugged -> "Plugged in · your buddy is happy"
      ringing -> "Battery at $level% · plug in to stop the cry"
      level < 0 -> "Waiting for a battery reading"
      else -> "Battery at $level% · alert at $threshold%"
    })
    BuddyStore.record(this, level, plugged)
    ChargingCue.update(this, plugged)
    AlarmStore.emit(this)
  }
  private fun stopAudio() { audio.stop(); ringing = false; currentSound = null }
  private fun notification(message: String): Notification {
    val open = packageManager.getLaunchIntentForPackage(packageName)!!
    val content = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val stop = PendingIntent.getService(this, 1, Intent(this, BatteryAlarmService::class.java).setAction(STOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    return Notification.Builder(this, CHANNEL).setContentTitle("Battery Buddy")
      .setContentText(message).setSmallIcon(R.drawable.ic_battery_buddy).setContentIntent(content)
      .setOngoing(true).setOnlyAlertOnce(true).setCategory(Notification.CATEGORY_SERVICE)
      .addAction(Notification.Action.Builder(null, "Turn off", stop).build()).build()
  }
  private fun updateNotification(message: String) {
    getSystemService(NotificationManager::class.java).notify(ID, notification(message))
  }
  override fun onDestroy() {
    if (registered) unregisterReceiver(receiver)
    stopAudio(); ChargingCue.stop(); running = false; BuddyStore.endMonitoring(this); AlarmStore.emit(this)
    super.onDestroy()
  }
  override fun onBind(intent: Intent?): IBinder? = null
}
