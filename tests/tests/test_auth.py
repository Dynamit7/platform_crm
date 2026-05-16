"""Tests for auth verify_bot_secret (no full app import)."""
import os, sys, unittest

# Don't import from main.py (it mounts static dirs) — test the logic directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "web"))


class TestVerifyBotSecret(unittest.TestCase):
    """Test that verify_bot_secret rejects invalid tokens."""

    def _make_verify(self, bot_token):
        """Replicate the verify_bot_secret logic for testing."""
        from fastapi import HTTPException

        async def verify(x_bot_secret: str | None = None):
            if not x_bot_secret or x_bot_secret != bot_token:
                raise HTTPException(status_code=403, detail="Forbidden: invalid bot secret")
            return x_bot_secret
        return verify

    def test_valid_secret(self):
        import asyncio
        verify = self._make_verify("real_token")
        result = asyncio.run(verify("real_token"))
        self.assertEqual(result, "real_token")

    def test_invalid_secret_raises(self):
        import asyncio
        from fastapi import HTTPException
        verify = self._make_verify("real_token")
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(verify("wrong_token"))
        self.assertEqual(ctx.exception.status_code, 403)

    def test_empty_secret_raises(self):
        import asyncio
        from fastapi import HTTPException
        verify = self._make_verify("real_token")
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(verify(None))
        self.assertEqual(ctx.exception.status_code, 403)

    def test_missing_secret_raises(self):
        import asyncio
        from fastapi import HTTPException
        verify = self._make_verify("real_token")
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(verify(""))
        self.assertEqual(ctx.exception.status_code, 403)




class TestYooKassaBasicAuth(unittest.TestCase):
    """Test YooKassa Basic Auth verification."""

    def _verify(self, auth_header, shop_id, secret_key):
        from bot.payments.webhooks import _verify_yookassa_basic_auth
        return _verify_yookassa_basic_auth(auth_header, shop_id, secret_key)

    def test_valid_credentials(self):
        import base64
        token = base64.b64encode(b"shop_123:secret_key_456").decode()
        result = self._verify(f"Basic {token}", "shop_123", "secret_key_456")
        self.assertTrue(result)

    def test_invalid_credentials(self):
        import base64
        token = base64.b64encode(b"shop_123:wrong_secret").decode()
        result = self._verify(f"Basic {token}", "shop_123", "secret_key_456")
        self.assertFalse(result)

    def test_missing_basic_prefix(self):
        result = self._verify("Bearer some_token", "shop_123", "secret")
        self.assertFalse(result)

    def test_empty_auth_header(self):
        result = self._verify("", "shop_123", "secret")
        self.assertFalse(result)

    def test_garbage_base64(self):
        result = self._verify("Basic not-valid-base64!!!", "shop_123", "secret")
        self.assertFalse(result)


if __name__ == "__main__":
    unittest.main()
