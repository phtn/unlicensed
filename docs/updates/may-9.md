#### Bug Fixes Update Report ⸬ Sun May 10, 2026  06:11:30 am - +08:00

---

## 1. Image Upload
- The errors you encountered while uploading images through the optimizer were caused by legacy code previously used for handling image uploads to Convex `_storage` (Legacy Bucket). Remnants like these are sometimes intentionally left in the codebase, declared but no longer actively called, to allow for rapid rollback or recovery scenarios. In this case, the issue surfaced during the migration and integration with the new Cloudflare R2 bucket.


- Update:
Image uploads now can be made directly into the product form on media section. When you pull up the gallery, an upload image button on the top left corner allows you to optimize and upload images directly. This works both on the product form and the category form. The dedicated image optimizer tool is still available and can be used for other use cases.

- Browsers:
WEBP format was invented by Google to make images load faster and use less bandwidth. Chrome V8 engine supports WEBP natively, including the use of `OffscreenCanvas` and its `.convertToBlob({type: 'image/webp'})` method.
Although Safari supports `OffscreenCanvas` now, it is still restrictive about which encoders are supported and within the service worker context (our optimizer). This instability sometimes hit an "unsupported type" error or output a fallback format.

Mullvad and other Tor based browsers are extremely restrictive to what browser features and apis it would allow to be natively supported. Although Firefox supports `OffscreenCanvas` natively, it is still restricted by the browser's security policies and may not allow service workers and other features that falls outside their private browsing principles.

---

## 2. Product CSV Upload Guide
- I've revamped the product CSV upload guide to make it easier to use and understand.
- I've also added error handlers to the CSV upload process to provide feedback to the user in case of errors.

---

## 3. Deals Custom Default price per Variant
- You can now set a custom default price per variant for your deals. An example would be for Build you own Oz. Set a different price for each 8 1/8 variant and 4 1/4.

---

## 4. Sign-in with Password 
- You can now sign in to your account using your password.
- To reset your password, click on the "Forgot Password" link on the sign-in page.
- To reset your password while signed-in, go to Account > Settings > Send Reset Password Email > Follow the link in the email to reset your password.

---

## 5. Duplicate Sign-in window is now resolved. 
- This issue was difficult to spot unless you're already investigating it. It was nice catch!  

---

## 6. Chat
- Dead Conversations - Some conversations may become dead due to the change in how we track visitors now. There were lots of chat rooms (conversations) that were created but will never be used again. My recommended solution is to archive them to clear up your conversation list. You can swipe left on any conversation and click the archive button. This works in both mobile and desktop views.
- User session has been updated and it no longer show "Active Now" for every user. Users are now tracked by their last activity. Green dots indicates a user was active within 5 mins. Amber dots indicate a user was active within 5-10 mins. and Gray dots indicate a user was 10+ mins of inactivity. Activity labels would also show gestures such as typing, sending messages, or scrolling.

---

## 7. Product Search
- Search is now improved filters not only by name but by every column in the product list such as category, price, or stock availability, brand, subcategory, and more.

---

## 8. Product Names & Brand Names Spelling
- I've updated the spelling of product names and brand names and fortified how they're parsed.
- Some brands have have pascal casing `['PlugPlay', 'ColdFire', 'SuperDope']` and are handled especially. Let me know if you have any more brands that fall on the same pattern and will add them to the list.
- 710 Labs and PlugPlay are now fixed in Shop Brands page.
- Z-41 and Camel Kush Farms have now been corrected.

---

## 9. Lineage in Product Details 
- now visible on products that have lineage data.

---

## 10. Then Minimum Redemption (in Rewards Settings)
- It was originally created as a limiter to how low a user could redeem rewards. It was never used as intended.
- What I find out that we use but have no way to configure and all are hard-coded was the Minimum Spend for Redemption. To which I have replaced it with and the $50 minimum spend is now configurable in the Rewards Settings.

---

## 11. On-Going
- Chat Comms UI fit check in-place
- CSV import issues investigations, trial uploads and imports, apply fixes and add improvements. 
- Duration: ~ 24hrs

---
