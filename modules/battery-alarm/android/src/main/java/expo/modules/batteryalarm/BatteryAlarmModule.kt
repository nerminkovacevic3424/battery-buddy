package expo.modules.batteryalarm

import android.content.*
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues
import java.io.File

class BatteryAlarmModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)
  private var receiver: BroadcastReceiver? = null
  private var preview: AlarmAudio? = null
  private val handler = Handler(Looper.getMainLooper())
  private val stopPreview = Runnable { preview?.stop(); preview = null }
  override fun definition() = ModuleDefinition {
    Name("BatteryAlarm")
    Events("onChange")
    OnStartObserving {
      if (receiver == null) {
        receiver = object : BroadcastReceiver() {
          override fun onReceive(c: Context, i: Intent) {
            if (i.action == Intent.ACTION_POWER_CONNECTED) stopPreview.run()
            if (i.action == Intent.ACTION_BATTERY_CHANGED || i.action == Intent.ACTION_POWER_CONNECTED) {
              val (level, plugged) = AlarmStore.battery(c)
              BuddyStore.record(c, level, plugged)
              if (!BatteryAlarmService.running) ChargingCue.update(c, i.action == Intent.ACTION_POWER_CONNECTED || plugged)
            }
            sendEvent("onChange", AlarmStore.snapshot(c))
          }
        }
        val filter = IntentFilter().apply {
          addAction(AlarmStore.EVENT); addAction(Intent.ACTION_BATTERY_CHANGED); addAction(Intent.ACTION_POWER_CONNECTED)
        }
        if (Build.VERSION.SDK_INT >= 33) context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else context.registerReceiver(receiver, filter)
      }
    }
    OnStopObserving { receiver?.let { context.unregisterReceiver(it) }; receiver = null; handler.post { if (!BatteryAlarmService.running) ChargingCue.reset() } }
    OnDestroy { handler.post(stopPreview) }
    AsyncFunction("getState") { AlarmStore.snapshot(context) }.runOnQueue(Queues.MAIN)
    AsyncFunction("readBuddy") { BuddyStore.read(context) }
    AsyncFunction("setChargingSound") { enabled: Boolean ->
      AlarmStore.prefs(context).edit().putBoolean("chargingSound", enabled).apply()
      if (!enabled) ChargingCue.stop()
      AlarmStore.emit(context)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("commitBuddy") { revision: Int, state: String -> BuddyStore.commit(context, revision, state) }
    AsyncFunction("setEnabled") { enabled: Boolean ->
      stopPreview.run()
      val p = AlarmStore.prefs(context)
      p.edit().putBoolean("enabled", enabled).apply()
      BatteryAlarmService.error = null
      try {
        if (enabled) context.startForegroundService(Intent(context, BatteryAlarmService::class.java))
        else context.stopService(Intent(context, BatteryAlarmService::class.java))
      } catch (e: Exception) { p.edit().putBoolean("enabled", false).apply(); throw e }
      AlarmStore.emit(context)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("configure") { threshold: Int, sound: String ->
      require(threshold in 1..99) { "Choose a percentage between 1 and 99." }
      require(sound in listOf("cry", "robot", "chime", "custom")) { "Unknown sound." }
      require(sound != "custom" || File(context.filesDir, "custom-alert").exists()) { "Import an audio file first." }
      stopPreview.run()
      AlarmStore.prefs(context).edit().putInt("threshold", threshold).putString("sound", sound).apply()
      if (BatteryAlarmService.running) context.startService(Intent(context, BatteryAlarmService::class.java).setAction(BatteryAlarmService.REFRESH))
      AlarmStore.emit(context)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("preview") { sound: String ->
      require(!BatteryAlarmService.ringing) { "Plug in or turn off monitoring before previewing a sound." }
      require(sound in listOf("cry", "robot", "chime", "custom"))
      handler.removeCallbacks(stopPreview); stopPreview.run()
      preview = AlarmAudio(context)
      preview?.play(sound, true) { message -> sendEvent("onChange", AlarmStore.snapshot(context) + mapOf("error" to message)) }
      handler.postDelayed(stopPreview, 4000)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("stopPreview") { handler.removeCallbacks(stopPreview); stopPreview.run() }.runOnQueue(Queues.MAIN)
    AsyncFunction("importSound") { uri: String, name: String ->
      val c = context
      val parsed = Uri.parse(uri)
      require(parsed.scheme in listOf("file", "content")) { "Choose a local audio file." }
      val temporary = File.createTempFile("sound-import-", ".audio", c.filesDir)
      try {
        c.contentResolver.openInputStream(parsed).use { input ->
          requireNotNull(input) { "Could not read the selected file." }
          temporary.outputStream().use { out ->
            val buffer = ByteArray(8192); var total = 0
            while (true) {
              val count = input.read(buffer); if (count < 0) break
              total += count; require(total <= 20 * 1024 * 1024) { "Choose an audio file smaller than 20 MB." }
              out.write(buffer, 0, count)
            }
          }
        }
        val metadata = MediaMetadataRetriever()
        try {
          metadata.setDataSource(temporary.absolutePath)
          require((metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0) > 0) { "This file does not contain playable audio." }
          require(metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO) == "yes") { "This file has no audio track." }
        } finally { metadata.release() }
        // Atomic replacement on the same filesystem preserves the old file on failure.
        android.system.Os.rename(temporary.absolutePath, File(c.filesDir, "custom-alert").absolutePath)
        AlarmStore.prefs(c).edit().putString("customName", name.take(120)).apply()
        AlarmStore.emit(c)
        name.take(120)
      } finally { temporary.delete() }
    }
  }
}
