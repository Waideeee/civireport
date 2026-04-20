<?php
DB::update("UPDATE users SET two_factor_secret = NULL, two_factor_recovery_codes = NULL WHERE email = 'lsamnth0510@gmail.com'");
echo "2FA Reset successfully for lsamnth0510@gmail.com\n";
