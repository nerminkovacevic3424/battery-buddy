package expo.modules.batteryalarm

/** Initial/sticky readings are a baseline, never a new charging event. */
internal class PowerConnectionPolicy {
  private var previous: Boolean? = null
  fun update(plugged: Boolean): Boolean {
    val connected = previous == false && plugged
    previous = plugged
    return connected
  }
  fun reset() { previous = null }
}
