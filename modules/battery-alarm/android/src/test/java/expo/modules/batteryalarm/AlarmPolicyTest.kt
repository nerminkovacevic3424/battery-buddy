package expo.modules.batteryalarm

import org.junit.Assert.*
import org.junit.Test

class AlarmPolicyTest {
  @Test fun thresholdBoundary() {
    assertFalse(AlarmPolicy.shouldRing(true, 21, 20, false))
    assertTrue(AlarmPolicy.shouldRing(true, 20, 20, false))
    assertTrue(AlarmPolicy.shouldRing(true, 0, 20, false))
  }
  @Test fun powerAlwaysSilences() {
    for (level in 0..100) for (threshold in 1..99) {
      assertFalse(AlarmPolicy.shouldRing(true, level, threshold, true))
    }
  }
  @Test fun disabledAndUnknownNeverRing() {
    assertFalse(AlarmPolicy.shouldRing(false, 1, 20, false))
    assertFalse(AlarmPolicy.shouldRing(true, -1, 20, false))
    assertFalse(AlarmPolicy.shouldRing(true, 101, 20, false))
  }
  @Test fun plugAndUnplugAtLowBattery() {
    assertTrue(AlarmPolicy.shouldRing(true, 10, 20, false))
    assertFalse(AlarmPolicy.shouldRing(true, 10, 20, true))
    assertTrue(AlarmPolicy.shouldRing(true, 10, 20, false))
  }
  @Test fun thresholdEditReevaluates() {
    assertTrue(AlarmPolicy.shouldRing(true, 18, 20, false))
    assertFalse(AlarmPolicy.shouldRing(true, 18, 15, false))
  }
}
