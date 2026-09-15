package expo.modules.batteryalarm

/** Unknown battery/power readings fail closed. External power always wins. */
internal object AlarmPolicy {
  fun shouldRing(enabled: Boolean, percent: Int, threshold: Int, plugged: Boolean): Boolean =
    enabled && !plugged && percent in 0..100 && percent <= threshold.coerceIn(1, 99)
}
