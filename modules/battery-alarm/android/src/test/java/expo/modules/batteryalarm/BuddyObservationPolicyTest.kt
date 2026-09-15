package expo.modules.batteryalarm
import org.junit.Assert.*
import org.junit.Test
class BuddyObservationPolicyTest {
  @Test fun qualifyingConnectionRewardsOncePerDay() {
    assertTrue(BuddyObservationPolicy.earlyCharge(10, true, true, 200, 199))
    assertFalse(BuddyObservationPolicy.earlyCharge(10, true, true, 200, 200))
    assertFalse(BuddyObservationPolicy.earlyCharge(10, true, true, 199, 200))
  }
  @Test fun unplugSpamDoesNotRearm() {
    assertFalse(BuddyObservationPolicy.rearm(48, false, 50))
    assertTrue(BuddyObservationPolicy.rearm(40, false, 50))
    assertFalse(BuddyObservationPolicy.rearm(40, true, 50))
    assertFalse(BuddyObservationPolicy.earlyCharge(40, true, false, 201, 200))
  }
  @Test fun lowOrUnknownAndNoConnectionDoNotReward() {
    assertFalse(BuddyObservationPolicy.earlyCharge(9, true, true, 200, 199))
    assertFalse(BuddyObservationPolicy.earlyCharge(-1, true, true, 200, 199))
    assertFalse(BuddyObservationPolicy.earlyCharge(20, false, true, 200, 199))
  }
}
