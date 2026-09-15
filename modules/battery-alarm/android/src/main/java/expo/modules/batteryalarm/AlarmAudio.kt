package expo.modules.batteryalarm

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.PowerManager
import java.io.File

internal class AlarmAudio(private val context: Context) {
  private var player: MediaPlayer? = null
  private val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private var focus: AudioFocusRequest? = null
  fun stop() {
    player?.release(); player = null
    focus?.let { manager.abandonAudioFocusRequest(it) }; focus = null
  }
  fun play(sound: String, loop: Boolean, onFailure: (String) -> Unit) {
    stop()
    val attrs = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
    val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      .setAudioAttributes(attrs).setOnAudioFocusChangeListener { change ->
        if (change < 0) { stop(); onFailure("Audio interrupted. The alert will retry when the battery updates.") }
      }.build()
    focus = request
    if (manager.requestAudioFocus(request) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
      stop(); onFailure("Audio is unavailable. Check calls, audio settings, and Do Not Disturb."); return
    }
    try {
      val p = MediaPlayer()
      player = p
      p.setAudioAttributes(attrs)
      p.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK)
      if (sound == "custom") p.setDataSource(File(context.filesDir, "custom-alert").absolutePath)
      else {
        val id = when (sound) { "robot" -> R.raw.robot; "chime" -> R.raw.chime; "charging" -> R.raw.charging; else -> R.raw.cry }
        context.resources.openRawResourceFd(id).use { p.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
      }
      p.isLooping = loop
      p.setOnCompletionListener { if (player === it) stop() }
      p.setOnErrorListener { _, _, _ -> stop(); onFailure("This sound could not be played. Choose another audio file."); true }
      p.setOnPreparedListener { if (player === it) it.start() }
      p.prepareAsync()
    } catch (e: Exception) { stop(); onFailure("Unable to play sound: ${e.localizedMessage}") }
  }
}
