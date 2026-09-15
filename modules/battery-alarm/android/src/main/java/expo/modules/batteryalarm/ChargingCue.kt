package expo.modules.batteryalarm

import android.content.Context

/** Main-thread, shared between the foreground UI and service to avoid double chimes. */
internal object ChargingCue {
  private val connection = PowerConnectionPolicy()
  private var audio: AlarmAudio? = null
  fun update(c: Context, plugged: Boolean) {
    val newlyConnected = connection.update(plugged)
    val enabled = AlarmStore.prefs(c).getBoolean("chargingSound", true)
    if (!plugged || !enabled) { stop(); return }
    if (newlyConnected) {
      val player = audio ?: AlarmAudio(c.applicationContext).also { audio = it }
      player.play("charging", false) { /* Optional cue never disrupts the battery alarm. */ }
    }
  }
  fun stop() { audio?.stop() }
  fun reset() { stop(); connection.reset() }
}
