# NFC Card Security

How VERIVA student cards are issued and verified, what that protects against,
and what it doesn't yet. Written so that anyone extending the NFC flow knows
which guarantees they must keep.

## The cards

VERIVA uses 13.56 MHz contactless cards (MIFARE Classic 1K). Each card holds
two separate things:

| | Chip serial (UID) | Data memory |
|---|---|---|
| Set by | The manufacturer; read-only | VERIVA, when the card is issued |
| Holds | A fixed number, e.g. `0116658347` | The encrypted token (an NDEF Text record) |
| Read by | Every reader, instantly | Phones and NDEF-capable readers only |

This split matters because the two kinds of reader we have see different things:

- **Phones** (e.g. NFC Tools) read the data memory and return the token.
- **Keyboard-wedge USB readers** only read the chip serial, turn it into 10
  digits and type it followed by Enter. They never see the token.

## Issuing a card

Only admins can issue cards (`assign-nfc`, `IsAdmin`).

1. The admin finds the student by registration number (**Students → Issue NFC Card**).
2. The admin taps a blank card on the USB reader. VERIVA records its chip
   serial in `NFCCard.card_serial`. A serial can belong to only one student.
   If no reader is at hand, the serial can be typed manually instead, but it
   must be in the same format the gate reader types (10 decimal digits for our
   readers), or gates won't match it.
3. VERIVA encrypts the student's registration number with Fernet
   (AES-128-CBC + HMAC-SHA256, key `NFC_ENCRYPTION_KEY`) and stores the result
   as `NFCCard.uid`.
4. The admin writes that token onto the same card as a Text record using a phone.

Issuing a replacement for a lost or deactivated card records the new card's
serial and a new token, so the old card stops working immediately.

## Verifying a card

Every scan endpoint (`nfc-lookup`, `nfc-tap`, `campus-nfc-tap`) accepts either
value and reports which one matched in `scan_method`:

| `scan_method` | Reader | What is proven |
|---|---|---|
| `token` | Phone / NDEF reader | The token was issued by VERIVA and hasn't been altered: it only decrypts with our key and its HMAC rejects any edit. |
| `serial` | USB keyboard reader | Only that a card with this serial was registered. |

When a gate matches on the serial alone, the NFC Station tells the guard to
confirm that the photo matches the person.

## Who can see the credentials

The token and the card serial are what a gate accepts, so anyone holding them
could make a copy of the card. `NFCCardSerializer` returns them **only to
admins**; security staff, lecturers, HoDs and deans see the card's status and
the decrypted registration number instead. `students/tests.py` checks this on
every endpoint that returns card data.

## What this protects against, and what it doesn't

**Current mode: USB readers, serial match (in use now).** This mode was chosen
because it works with the reader hardware we have.

- ✅ Nobody can issue or alter a card except an admin.
- ✅ Lost cards are revoked instantly (report lost / issue replacement).
- ✅ Card credentials never leave the admin role through the API.
- ⚠️ **The gate does not check the encrypted token in this mode.** A chip
  serial is not secret (any phone displays it), and "magic" MIFARE cards with
  a writable serial are cheap. Someone who reads a student's card could make a
  card that passes the gate. The guard's photo check is the control here.

**Planned mode: phone as gate reader (Web NFC).** Chrome on Android reads the
token *and* the chip serial in one tap. The server will require both: the
token must decrypt, and it must belong to that card's serial. That stops forged
tokens and tokens copied onto another card. Requirements: an Android phone
with Chrome at the gate and the site served over HTTPS.

**Remaining limit of the card itself.** MIFARE Classic's own encryption
(Crypto-1) has been broken since 2008. With specialist tools, a whole card,
serial included, can be cloned onto a magic card. Only cards with modern
cryptography (MIFARE DESFire EV2/EV3) remove that risk; they are the
recommendation for a university-wide rollout.

## Operating rules

- **Never change `NFC_ENCRYPTION_KEY`** once cards are issued: every token
  written under the old key stops verifying. Treat it like a database password
  and keep it out of the repository.
- **Report lost cards immediately**. Revocation is the main defence against a
  copied card in the current mode.
- **Guards check the photo** on every serial-only match.
