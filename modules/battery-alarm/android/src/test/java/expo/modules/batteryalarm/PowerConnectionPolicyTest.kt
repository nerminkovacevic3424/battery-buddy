package expo.modules.batteryalarm
import org.junit.Assert.*
import org.junit.Test
class PowerConnectionPolicyTest {
  @Test fun alreadyPluggedInAtLaunchIsSilent() {
    val policy = PowerConnectionPolicy()
    assertFalse(policy.update(true))
    assertFalse(policy.update(true))
  }
  @Test fun connectionChimesOnceAcrossDuplicateBroadcasts() {
    val policy = PowerConnectionPolicy()
    assertFalse(policy.update(false))
    assertTrue(policy.update(true))
    repeat(10) { assertFalse(policy.update(true)) }
    assertFalse(policy.update(false))
    assertTrue(policy.update(true))
  }
  @Test fun resetRequiresFreshBaseline() {
    val policy = PowerConnectionPolicy()
    policy.update(false); policy.reset()
    assertFalse(policy.update(true))
  }
}
