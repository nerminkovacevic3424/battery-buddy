package expo.modules.batteryalarm

/** Pure transition policy; plug spam cannot create additional care sessions. */
internal object BuddyObservationPolicy {
  fun earlyCharge(level: Int, connected: Boolean, armed: Boolean, today: Long, lastRewardDay: Long): Boolean =
    connected && armed && level in 10..100 && today > lastRewardDay
  fun rearm(level: Int, plugged: Boolean, peak: Int): Boolean =
    !plugged && level in 0..100 && peak - level >= 10
}
