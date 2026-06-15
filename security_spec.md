# Firebase Security Specification & TDD Spec

## 1. Data Invariants
- **Public Reads**: Customer reviews (`reviews/*`) and active gallery showcase images (`gallery/*`) are readable by anyone (authenticated or anonymous).
- **Public Creation/Write Access**:
  - Anyone can submit a standard customer Review (`reviews/*`), provided the rating is between 1 and 5, and the payload matches the exact required keys.
  - Anyone can submit a diagnosis/triage request (`repairs/*`) or request direct GM attention (`gmq/*`), provided the fields follow type-matching schemas.
- **Strict Staff/Admin Controls**:
  - Only authenticated admins/staff can update or delete `repairs/*` status registries, `gmq/*` messages, and overwrite standard catalog portfolio cards in `gallery/*`.
  - Identity spoofing is prevented by binding owner claims or confirming roles.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
We define twelve high-risk test payloads designed to exploit update gaps, identity spoofing, value poisoning, or size limitations:

1. **Spoofed ID Write**: Submitting a review with a 2MB junk ID.
2. **Invalid Rating Bound**: Creating a review with a rating of `10`.
3. **Empty Name Review**: Creating a review without a sender name.
4. **Wrong Timestamp Value**: Submitting a review where the key `timestamp` isn't a string or formatted incorrectly.
5. **Unauthorized Repair Hijack**: A random user trying to set a repair status to `"Returned"` without auth.
6. **Malicious Ghost Fields**: Injecting `{"isAdmin": true}` inside a general submission.
7. **Jumbo String Spam**: Creating a repair record with a 500KB string for the brand name.
8. **Unchecked ID Poisoning**: Specifying `repairs/%0a/path` as an injection vector inside a document targeting query.
9. **Private GM Request Scraping**: Attempting to list all GM Requests without correct administrative roles.
10. **Admin Claim Backdoor**: Submitting custom authentication credentials to bypass the database authorization layer.
11. **Immutability Breach**: Attempting to alter the immutable `createdAt` timestamp of a repair ticket.
12. **Out of Order Progression**: Fast-tracking repair states directly from received to ready-for-pickup by bypassing sequential checklists.

---

## 3. Standard Fortress Firestore Rules Layout
The rules will be saved in `/firestore.rules` and deployed to protect the client and secure raw endpoints.
Below are the proposed security logic gates verified against security spec targets.
