# PRD نهایی

## Conversation Request Reliability System

### Useravaa MVP

---

## 1. Product Summary

**Conversation Request Reliability System** قابلیتی در Useravaa است که باعث می‌شود هیچ درخواست گفت‌وگویی بدون پاسخ، بدون مهلت و بدون پایان مشخص رها نشود.

در مدل درخواست‌محور Useravaa، Requester ابتدا از داخل پروفایل تجربه، درخواست گفت‌وگو ثبت می‌کند. Provider باید حداکثر تا ۲۴ ساعت پاسخ دهد. اگر Provider پاسخ دهد و حداقل ۳ زمان پیشنهاد کند، Requester باید حداکثر تا ۴۸ ساعت یکی از زمان‌ها را انتخاب کند. پرداخت فقط بعد از انتخاب زمان فعال می‌شود. اگر هرکدام از طرفین در مهلت مقرر اقدام نکنند، درخواست منقضی می‌شود و سیستم مسیر جایگزین مثل نمایش تجربه‌های مشابه را ارائه می‌دهد.

---

## 2. Product Objective

هدف این قابلیت:

* جلوگیری از درخواست‌های بی‌پاسخ
* حذف وضعیت‌های pending بی‌پایان
* حفظ momentum کاربر بعد از ارسال درخواست
* افزایش اعتماد به Useravaa
* افزایش نرخ تبدیل درخواست به زمان پیشنهادی
* افزایش نرخ تبدیل زمان پیشنهادی به پرداخت
* کاهش تجربه‌های مرده در MVP

---

## 3. Problem Statement

در Useravaa، گفت‌وگوها مستقیم رزرو نمی‌شوند. Requester ابتدا درخواست گفت‌وگو می‌فرستد و Provider بعداً زمان پیشنهاد می‌دهد.

اگر Provider دیر پاسخ دهد یا اصلاً پاسخ ندهد، Requester در وضعیت نامشخص باقی می‌ماند. این باعث می‌شود:

* حس بی‌اعتمادی نسبت به پلتفرم ایجاد شود.
* احتمال پرداخت و نهایی‌سازی گفت‌وگو کاهش پیدا کند.
* درخواست‌های مرده در سیستم زیاد شوند.
* تیم محصول نتواند وضعیت واقعی funnel را درست اندازه‌گیری کند.
* Requester بعد از expire مسیر جایگزین مشخصی نداشته باشد.

---

## 4. Product Solution

هر درخواست گفت‌وگو باید:

1. وضعیت مشخص داشته باشد.
2. owner اقدام بعدی داشته باشد.
3. مهلت پاسخ داشته باشد.
4. countdown داشته باشد.
5. با email و in-app notification پشتیبانی شود.
6. در صورت عدم اقدام، خودکار expire شود.
7. بعد از expire، مسیر جایگزین نشان دهد.

فلو اصلی:

```text
Requester درخواست می‌فرستد
Provider ایمیل و in-app notification دریافت می‌کند
Provider تا ۲۴ ساعت پاسخ می‌دهد
Provider یا رد می‌کند یا حداقل ۳ زمان پیشنهاد می‌دهد
Requester تا ۴۸ ساعت یکی از زمان‌ها را انتخاب می‌کند
بعد از انتخاب زمان، پرداخت فعال می‌شود
بعد از پرداخت، گفت‌وگو confirmed می‌شود
اگر اقدام لازم در مهلت انجام نشود، request expired می‌شود
بعد از expire، تجربه‌های مشابه نمایش داده می‌شود
```

---

## 5. Scope

### In Scope

| Item                             | Requirement                                             |
| -------------------------------- | ------------------------------------------------------- |
| Provider response SLA            | Provider باید تا ۲۴ ساعت پاسخ دهد.                      |
| Automatic expiration             | اگر Provider پاسخ ندهد، درخواست expired شود.            |
| Time proposal                    | Provider باید حداقل ۳ زمان پیشنهاد دهد.                 |
| Requester selection SLA          | Requester باید تا ۴۸ ساعت یکی از زمان‌ها را انتخاب کند. |
| SMTP email                       | ایمیل transactional از طریق SMTP هاست ارسال شود.        |
| In-app notification              | داخل محصول notification ثبت شود.                        |
| Badge                            | در پنل کاربر badge نمایش داده شود.                      |
| Countdown                        | زمان باقی‌مانده برای اقدام نمایش داده شود.              |
| Request statuses                 | همه درخواست‌ها وضعیت مشخص داشته باشند.                  |
| Similar experiences              | بعد از expire، ۳ تا ۵ تجربه مشابه نمایش داده شود.       |
| No payment before time selection | پرداخت فقط بعد از انتخاب زمان فعال شود.                 |

### Out of Scope

| Item                          | Reason                              |
| ----------------------------- | ----------------------------------- |
| SMS                           | خارج از MVP                         |
| WhatsApp API                  | خارج از MVP                         |
| Push notification             | خارج از MVP                         |
| Follow                        | social feature نیست                 |
| Social notification           | خارج از قابلیت reliability          |
| Manual follow-up              | نباید به عملیات دستی وابسته باشد    |
| Free chat                     | مذاکره آزاد در MVP حذف می‌شود       |
| Complex matching              | فقط معیار ساده برای تجربه‌های مشابه |
| Payment before time selection | خلاف فلو نهایی                      |

---

## 6. Users and Roles

| Role      | Description                                                         | Main Actions                                                  |
| --------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| Requester | کاربری که درخواست گفت‌وگو ثبت می‌کند.                               | ارسال درخواست، دیدن وضعیت، انتخاب زمان، پرداخت، لغو درخواست   |
| Provider  | کاربری که پروفایل تجربه دارد و درخواست دریافت می‌کند.               | دیدن درخواست، پیشنهاد زمان، رد درخواست                        |
| System    | سیستم Useravaa که deadline، status و notification را مدیریت می‌کند. | expire خودکار، ارسال notification، ارسال email، ثبت confirmed |

---

## 7. Core User Flow

### 7.1 Requester Flow

1. Requester وارد پروفایل تجربه می‌شود.
2. روی **درخواست گفت‌وگو** کلیک می‌کند.
3. مدت گفت‌وگو را انتخاب می‌کند.
4. توضیح آزاد درباره تصمیم، ابهام یا نیاز خود می‌نویسد.
5. درخواست را ارسال می‌کند.
6. درخواست با status برابر `pending_provider_response` ثبت می‌شود.
7. Requester در صفحه گفت‌وگوها می‌بیند که درخواست منتظر پاسخ Provider است.
8. اگر Provider زمان پیشنهاد دهد، Requester notification و email دریافت می‌کند.
9. Requester یکی از زمان‌های پیشنهادی را تا ۴۸ ساعت انتخاب می‌کند.
10. بعد از انتخاب زمان، وارد مرحله پرداخت می‌شود.
11. بعد از پرداخت، گفت‌وگو `confirmed` می‌شود.

### 7.2 Provider Flow

1. Provider درخواست جدید دریافت می‌کند.
2. Provider in-app notification و email دریافت می‌کند.
3. در پنل خود badge درخواست جدید می‌بیند.
4. Provider countdown مهلت ۲۴ ساعته را می‌بیند.
5. Provider یکی از دو اقدام را انجام می‌دهد:

   * پیشنهاد حداقل ۳ زمان
   * رد درخواست
6. اگر زمان پیشنهاد دهد، status به `times_proposed` تغییر می‌کند.
7. اگر رد کند، status به `rejected` تغییر می‌کند.
8. اگر در ۲۴ ساعت اقدام نکند، System درخواست را `expired` می‌کند.

### 7.3 Expired Flow

1. اگر Provider پاسخ ندهد، request expired می‌شود.
2. Requester پیام expire می‌بیند.
3. سیستم ۳ تا ۵ تجربه مشابه نمایش می‌دهد.
4. Requester می‌تواند مسیر خود را با پروفایل‌های مشابه ادامه دهد.

---

## 8. Request Status Model

| Status                      | Owner     | Meaning                                      | Next Action                               |
| --------------------------- | --------- | -------------------------------------------- | ----------------------------------------- |
| `pending_provider_response` | Provider  | درخواست ارسال شده و منتظر پاسخ Provider است. | Provider باید زمان پیشنهاد دهد یا رد کند. |
| `times_proposed`            | Requester | Provider حداقل ۳ زمان پیشنهاد داده است.      | Requester باید یک زمان انتخاب کند.        |
| `pending_payment`           | Requester | Requester یک زمان را انتخاب کرده است.        | Requester باید پرداخت کند.                |
| `confirmed`                 | System    | پرداخت انجام شده و گفت‌وگو ثبت شده است.      | یادآوری زمان گفت‌وگو ارسال شود.           |
| `rejected`                  | Provider  | Provider درخواست را رد کرده است.             | درخواست بسته است.                         |
| `expired`                   | System    | مهلت پاسخ یا انتخاب زمان تمام شده است.       | تجربه‌های مشابه نمایش داده شود.           |
| `cancelled`                 | Requester | Requester درخواست را لغو کرده است.           | درخواست بسته است.                         |

---

## 9. State Machine

```json
{
  "entity": "ConversationRequest",
  "initialState": "pending_provider_response",
  "states": [
    "pending_provider_response",
    "times_proposed",
    "pending_payment",
    "confirmed",
    "rejected",
    "expired",
    "cancelled"
  ],
  "transitions": [
    {
      "from": "pending_provider_response",
      "to": "times_proposed",
      "actor": "provider",
      "action": "propose_times",
      "condition": "at_least_3_times"
    },
    {
      "from": "pending_provider_response",
      "to": "rejected",
      "actor": "provider",
      "action": "reject_request"
    },
    {
      "from": "pending_provider_response",
      "to": "expired",
      "actor": "system",
      "action": "expire_after_24h"
    },
    {
      "from": "pending_provider_response",
      "to": "cancelled",
      "actor": "requester",
      "action": "cancel_request"
    },
    {
      "from": "times_proposed",
      "to": "pending_payment",
      "actor": "requester",
      "action": "select_time",
      "condition": "within_48h"
    },
    {
      "from": "times_proposed",
      "to": "expired",
      "actor": "system",
      "action": "expire_after_48h"
    },
    {
      "from": "times_proposed",
      "to": "cancelled",
      "actor": "requester",
      "action": "cancel_request"
    },
    {
      "from": "pending_payment",
      "to": "confirmed",
      "actor": "requester",
      "action": "complete_payment"
    },
    {
      "from": "pending_payment",
      "to": "cancelled",
      "actor": "requester",
      "action": "cancel_before_payment"
    }
  ],
  "invalidTransitionBehavior": {
    "httpStatus": 409,
    "errorCode": "INVALID_CONVERSATION_REQUEST_STATE"
  }
}
```

---

## 10. Business Rules

### 10.1 Provider Response SLA

Provider must respond within ۲۴ hours.

Valid Provider responses:

| Action               | Result                          |
| -------------------- | ------------------------------- |
| پیشنهاد حداقل ۳ زمان | status becomes `times_proposed` |
| رد درخواست           | status becomes `rejected`       |

System rule:

```text
If now > providerResponseDeadlineAt and status = pending_provider_response:
status = expired
```

---

### 10.2 Requester Time Selection SLA

Requester must select one proposed time within ۴۸ hours after Provider proposes times.

System rule:

```text
If now > requesterSelectionDeadlineAt and status = times_proposed:
status = expired
```

---

### 10.3 Minimum Proposed Times

Provider must propose at least ۳ times.

Validation:

```json
{
  "proposedTimes": {
    "minItems": 3,
    "errorKey": "conversation.proposedTimes.minimumRequired"
  }
}
```

---

### 10.4 Payment Rule

Payment is only available after Requester selects one proposed time.

Rules:

```text
Payment disabled when status = pending_provider_response
Payment disabled when status = times_proposed
Payment enabled when status = pending_payment
After payment success, status = confirmed
```

---

### 10.5 No Infinite Pending

No request can remain pending forever.

Rules:

```text
pending_provider_response has 24h deadline
times_proposed has 48h deadline
pending_payment must have a defined payment expiry if later product decides
```

For MVP, payment expiry is not defined in this BRD. It should be tracked as an open product decision if needed.

---

## 11. Deadline Fields

Each request should store:

| Field                          | Type              | Description                  |
| ------------------------------ | ----------------- | ---------------------------- |
| `createdAt`                    | datetime          | زمان ثبت درخواست             |
| `providerResponseDeadlineAt`   | datetime          | createdAt + 24h              |
| `providerRespondedAt`          | datetime nullable | زمان پاسخ Provider           |
| `timesProposedAt`              | datetime nullable | زمان ارسال زمان‌های پیشنهادی |
| `requesterSelectionDeadlineAt` | datetime nullable | timesProposedAt + 48h        |
| `selectedTimeId`               | string nullable   | زمان انتخاب‌شده              |
| `selectedAt`                   | datetime nullable | زمان انتخاب Requester        |
| `paidAt`                       | datetime nullable | زمان پرداخت                  |
| `expiredAt`                    | datetime nullable | زمان expire                  |
| `cancelledAt`                  | datetime nullable | زمان لغو                     |
| `rejectedAt`                   | datetime nullable | زمان رد Provider             |

---

## 12. Notification Requirements

### 12.1 In-App Notifications

| Trigger                    | Receiver  | Message                                        | Target                            |
| -------------------------- | --------- | ---------------------------------------------- | --------------------------------- |
| درخواست جدید               | Provider  | یک درخواست گفت‌وگوی جدید دریافت کردید.         | `/conversations/{id}`             |
| زمان‌های پیشنهادی ارسال شد | Requester | زمان‌های پیشنهادی برای گفت‌وگوی شما آماده است. | `/conversations/{id}/select-time` |
| نزدیک انقضا                | Provider  | این درخواست تا چند ساعت دیگر منقضی می‌شود.     | `/conversations/{id}`             |
| گفت‌وگو نهایی شد           | هر دو     | گفت‌وگوی شما ثبت شد.                           | `/conversations/{id}`             |
| یادآوری زمان گفت‌وگو       | هر دو     | گفت‌وگوی شما تا یک ساعت دیگر شروع می‌شود.      | `/conversations/{id}`             |

### 12.2 Badge Requirements

Badge should appear when:

| User      | Condition                                    |
| --------- | -------------------------------------------- |
| Provider  | has request with `pending_provider_response` |
| Requester | has request with `times_proposed`            |
| Requester | has request with `pending_payment`           |
| Any user  | has unread notification                      |

---

## 13. Email Requirements

### 13.1 Email Channel

Emails must be transactional and sent via hosting SMTP.

Sender:

```text
notifications@useravaa.com
```

### 13.2 Email Matrix

| Trigger                    | Receiver  | Email Required  |
| -------------------------- | --------- | --------------- |
| درخواست جدید               | Provider  | Yes             |
| زمان‌های پیشنهادی ارسال شد | Requester | Yes             |
| گفت‌وگو نهایی شد           | هر دو     | Yes             |
| یادآوری زمان گفت‌وگو       | هر دو     | Yes             |
| نزدیک انقضا                | Provider  | No, only in-app |

### 13.3 SMTP Requirements

Required SMTP environment variables:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=notifications@useravaa.com
SMTP_SECURE=true
```

Deliverability requirements:

* SPF configured
* DKIM configured
* DMARC configured
* Email templates must be transactional, not marketing
* Each email must include a direct link to the relevant Useravaa page

---

## 14. Email Templates

### 14.1 New Request Email

Subject:

```text
درخواست گفت‌وگوی جدید در Useravaa
```

Body:

```text
سلام،

یک درخواست گفت‌وگوی جدید دریافت کرده‌اید.
لطفاً تا ۲۴ ساعت آینده درخواست را بررسی کنید و در صورت امکان حداقل ۳ زمان پیشنهادی ارسال کنید.

مشاهده درخواست در Useravaa
```

Target:

```text
/conversations/{conversationId}
```

---

### 14.2 Proposed Times Email

Subject:

```text
زمان‌های پیشنهادی گفت‌وگوی شما آماده است
```

Body:

```text
سلام،

زمان‌های پیشنهادی برای گفت‌وگوی شما آماده شده است.
لطفاً یکی از زمان‌ها را انتخاب کنید تا وارد مرحله پرداخت و ثبت گفت‌وگو شوید.

مشاهده زمان‌های پیشنهادی
```

Target:

```text
/conversations/{conversationId}/select-time
```

---

### 14.3 Confirmed Conversation Email

Subject:

```text
گفت‌وگوی شما در Useravaa ثبت شد
```

Body:

```text
سلام،

گفت‌وگوی شما با موفقیت ثبت شد.
جزئیات زمان گفت‌وگو در حساب کاربری شما قابل مشاهده است.

مشاهده گفت‌وگو
```

Target:

```text
/conversations/{conversationId}
```

---

### 14.4 Conversation Reminder Email

Subject:

```text
یادآوری گفت‌وگوی امروز
```

Body:

```text
سلام،

گفت‌وگوی شما تا یک ساعت دیگر شروع می‌شود.
لطفاً جزئیات گفت‌وگو را در Useravaa بررسی کنید.

مشاهده گفت‌وگو
```

Target:

```text
/conversations/{conversationId}
```

---

## 15. UX Requirements

### 15.1 Requester UX

Requester must always know:

* request status
* who should act next
* remaining time
* what happens after no response
* next available action

#### Status Copy, Waiting for Provider

```text
در انتظار پاسخ Provider
پاسخ تا ۲۴ ساعت آینده مشخص می‌شود.
```

#### Expired Copy

```text
این درخواست در زمان مقرر پاسخ نگرفت. می‌توانید تجربه‌های مشابه را بررسی کنید.
```

#### Times Proposed Copy

```text
زمان‌های پیشنهادی آماده است
یکی از زمان‌ها را تا ۴۸ ساعت آینده انتخاب کنید.
```

#### Pending Payment Copy

```text
زمان گفت‌وگو انتخاب شده است
برای ثبت نهایی گفت‌وگو، پرداخت را تکمیل کنید.
```

---

### 15.2 Provider UX

Provider must see:

* new requests
* countdown to response deadline
* propose times button
* reject request button
* status owner
* warning near expiration

#### New Request Copy

```text
درخواست جدید
۱۸ ساعت تا پایان مهلت پاسخ
```

#### Provider CTA

```text
پیشنهاد زمان
```

```text
رد درخواست
```

#### Expiration Warning Copy

```text
این درخواست تا چند ساعت دیگر منقضی می‌شود.
```

---

## 16. Conversation Page Placement

### Conversations Page

Route:

```text
/conversations
```

Tabs:

```text
درخواست‌های من
درخواست‌های دریافتی
```

Groups:

```text
نیازمند اقدام
در حال پیگیری
تمام‌شده
```

### Mapping to Groups

| Status                      | Requester Tab | Provider Tab  |
| --------------------------- | ------------- | ------------- |
| `pending_provider_response` | در حال پیگیری | نیازمند اقدام |
| `times_proposed`            | نیازمند اقدام | در حال پیگیری |
| `pending_payment`           | نیازمند اقدام | در حال پیگیری |
| `confirmed`                 | در حال پیگیری | در حال پیگیری |
| `rejected`                  | تمام‌شده      | تمام‌شده      |
| `expired`                   | تمام‌شده      | تمام‌شده      |
| `cancelled`                 | تمام‌شده      | تمام‌شده      |

---

## 17. Similar Experiences After Expire

### Display Condition

Show when:

```text
request.status = expired
```

### Section Title

```text
تجربه‌های مشابه برای ادامه مسیر
```

### Display Count

```text
3 to 5 profiles
```

### MVP Similarity Criteria

Use simple criteria:

1. Same job field.
2. Same or nearby org level.
3. Similar previous or current company if available.
4. More active or more responsive Providers if data exists.

### Forbidden Words

Do not show these words in UI:

```text
match
score
درصد نزدیکی
```

### UI Rule

Do not expose ranking logic. Just show the section as a helpful continuation path.

---

## 18. Data Model

### ConversationRequest

| Field                          | Type              | Required |
| ------------------------------ | ----------------- | -------- |
| `id`                           | string            | yes      |
| `requesterId`                  | string            | yes      |
| `providerId`                   | string            | yes      |
| `profileId`                    | string            | yes      |
| `durationMinutes`              | enum 30, 60       | yes      |
| `requestNote`                  | string nullable   | no       |
| `status`                       | enum              | yes      |
| `createdAt`                    | datetime          | yes      |
| `providerResponseDeadlineAt`   | datetime          | yes      |
| `providerRespondedAt`          | datetime nullable | no       |
| `timesProposedAt`              | datetime nullable | no       |
| `requesterSelectionDeadlineAt` | datetime nullable | no       |
| `selectedTimeId`               | string nullable   | no       |
| `selectedAt`                   | datetime nullable | no       |
| `paidAt`                       | datetime nullable | no       |
| `confirmedAt`                  | datetime nullable | no       |
| `rejectedAt`                   | datetime nullable | no       |
| `expiredAt`                    | datetime nullable | no       |
| `cancelledAt`                  | datetime nullable | no       |

### ProposedTime

| Field                   | Type    | Required |
| ----------------------- | ------- | -------- |
| `id`                    | string  | yes      |
| `conversationRequestId` | string  | yes      |
| `date`                  | date    | yes      |
| `time`                  | string  | yes      |
| `displayDateFa`         | string  | yes      |
| `displayTimeFa`         | string  | yes      |
| `isSelected`            | boolean | yes      |

### Notification

| Field         | Type         | Required |
| ------------- | ------------ | -------- |
| `id`          | string       | yes      |
| `receiverId`  | string       | yes      |
| `type`        | enum         | yes      |
| `message`     | string       | yes      |
| `targetRoute` | string       | yes      |
| `status`      | unread, read | yes      |
| `createdAt`   | datetime     | yes      |

### EmailLog

| Field                   | Type                 | Required |
| ----------------------- | -------------------- | -------- |
| `id`                    | string               | yes      |
| `receiverId`            | string               | yes      |
| `conversationRequestId` | string               | yes      |
| `templateKey`           | string               | yes      |
| `toEmail`               | string               | yes      |
| `subject`               | string               | yes      |
| `status`                | queued, sent, failed | yes      |
| `sentAt`                | datetime nullable    | no       |
| `failedReason`          | string nullable      | no       |

---

## 19. API Requirements

### POST `/api/conversation-requests`

Creates request.

Request:

```json
{
  "profileId": "string",
  "durationMinutes": 30,
  "requestNote": "string"
}
```

Response:

```json
{
  "id": "string",
  "status": "pending_provider_response",
  "providerResponseDeadlineAt": "datetime"
}
```

---

### GET `/api/conversation-requests`

Returns user's requests by tab and group.

Query:

```text
direction=sent|received
group=needs_action|tracking|done
```

---

### GET `/api/conversation-requests/{id}`

Returns detail with status, deadline, next action, proposed times and similar experiences if expired.

---

### POST `/api/conversation-requests/{id}/propose-times`

Provider proposes times.

Request:

```json
{
  "times": [
    {
      "date": "2026-06-01",
      "time": "15:00"
    },
    {
      "date": "2026-06-02",
      "time": "10:00"
    },
    {
      "date": "2026-06-03",
      "time": "18:00"
    }
  ]
}
```

Validation:

```text
minimum 3 times
```

Response:

```json
{
  "id": "string",
  "status": "times_proposed",
  "requesterSelectionDeadlineAt": "datetime"
}
```

---

### POST `/api/conversation-requests/{id}/reject`

Provider rejects request.

Response:

```json
{
  "id": "string",
  "status": "rejected"
}
```

---

### POST `/api/conversation-requests/{id}/select-time`

Requester selects one proposed time.

Request:

```json
{
  "proposedTimeId": "string"
}
```

Response:

```json
{
  "id": "string",
  "status": "pending_payment",
  "selectedTimeId": "string"
}
```

---

### POST `/api/conversation-requests/{id}/cancel`

Requester cancels request.

Response:

```json
{
  "id": "string",
  "status": "cancelled"
}
```

---

### POST `/api/conversation-requests/{id}/expire`

System-only endpoint or job action.

Response:

```json
{
  "id": "string",
  "status": "expired"
}
```

---

### GET `/api/conversation-requests/{id}/similar-experiences`

Returns ۳ تا ۵ similar profiles after expire.

Response:

```json
{
  "items": [
    {
      "profileId": "string",
      "displayName": "string",
      "jobTitle": "string",
      "jobField": "string",
      "orgLevel": "string"
    }
  ]
}
```

---

## 20. Background Jobs

### 20.1 Expire Provider Pending Requests

Frequency:

```text
every 15 minutes
```

Logic:

```text
Find requests where status = pending_provider_response
and now > providerResponseDeadlineAt
Set status = expired
Set expiredAt = now
Create in-app notification for Requester
```

### 20.2 Expire Proposed Times

Frequency:

```text
every 15 minutes
```

Logic:

```text
Find requests where status = times_proposed
and now > requesterSelectionDeadlineAt
Set status = expired
Set expiredAt = now
Create in-app notification for Requester and Provider
```

### 20.3 Conversation Reminder

Frequency:

```text
every 15 minutes
```

Logic:

```text
Find confirmed conversations starting in approximately 1 hour
Send email and in-app notification to both users
```

### 20.4 Expiration Warning

Frequency:

```text
every 1 hour
```

Logic:

```text
Find pending_provider_response requests close to providerResponseDeadlineAt
Create in-app notification for Provider
```

Exact warning threshold can be ۳ hours before expiration in MVP unless product decides otherwise.

---

## 21. Validation Rules

| Form           | Field           | Rule                               |
| -------------- | --------------- | ---------------------------------- |
| Create request | profileId       | required                           |
| Create request | durationMinutes | 30 or 60                           |
| Create request | requestNote     | optional, max length to be defined |
| Propose times  | times           | minimum 3                          |
| Propose times  | date            | required                           |
| Propose times  | time            | required                           |
| Propose times  | duplicates      | not allowed                        |
| Select time    | proposedTimeId  | must belong to same request        |
| Select time    | status          | must be `times_proposed`           |
| Payment        | status          | must be `pending_payment`          |

---

## 22. Error Messages

| Error Code                     | Message                                           |
| ------------------------------ | ------------------------------------------------- |
| `REQUEST_NOT_FOUND`            | درخواست پیدا نشد.                                 |
| `REQUEST_EXPIRED`              | این درخواست منقضی شده است.                        |
| `INVALID_REQUEST_STATUS`       | وضعیت این درخواست اجازه انجام این کار را نمی‌دهد. |
| `MINIMUM_THREE_TIMES_REQUIRED` | حداقل ۳ زمان پیشنهادی انتخاب کنید.                |
| `DUPLICATE_TIME_OPTION`        | زمان‌های پیشنهادی نباید تکراری باشند.             |
| `TIME_SELECTION_EXPIRED`       | مهلت انتخاب زمان تمام شده است.                    |
| `PAYMENT_NOT_AVAILABLE`        | پرداخت فقط بعد از انتخاب زمان فعال می‌شود.        |
| `REQUEST_ALREADY_CANCELLED`    | این درخواست قبلاً لغو شده است.                    |

---

## 23. Analytics Events

| Event                                              | Trigger                                |
| -------------------------------------------------- | -------------------------------------- |
| `conversation_request_created`                     | Requester submits request              |
| `conversation_request_email_sent`                  | New request email sent                 |
| `conversation_request_in_app_notification_created` | In-app notification created            |
| `provider_request_viewed`                          | Provider opens request                 |
| `provider_times_proposed`                          | Provider proposes times                |
| `provider_request_rejected`                        | Provider rejects                       |
| `conversation_request_expired`                     | System expires request                 |
| `requester_times_viewed`                           | Requester views proposed times         |
| `requester_time_selected`                          | Requester selects time                 |
| `conversation_payment_started`                     | Payment starts                         |
| `conversation_confirmed`                           | Payment succeeds                       |
| `similar_experiences_shown_after_expire`           | Expired request shows similar profiles |
| `similar_experience_clicked_after_expire`          | Requester opens similar profile        |

---

## 24. Success Metrics

| Metric                               | Formula                                 | MVP Target              |
| ------------------------------------ | --------------------------------------- | ----------------------- |
| Provider response rate               | responded requests / total requests     | above 70 percent        |
| Expired requests rate                | expired requests / total requests       | below 30 percent        |
| Request to proposed times conversion | times proposed / total requests         | above 60 percent        |
| Proposed times to payment conversion | confirmed / times proposed              | above 40 percent        |
| Confirmed conversation rate          | confirmed / total requests              | measurable from day one |
| Average provider response time       | avg providerRespondedAt minus createdAt | below 24h               |

---

## 25. Risks and Mitigations

| Risk                            | Mitigation                                |
| ------------------------------- | ----------------------------------------- |
| Provider does not see email     | In-app badge and countdown                |
| Too many expired requests       | Reduce visibility of slow Providers later |
| Requester leaves after expire   | Show similar experiences                  |
| SMTP goes to spam               | Configure SPF, DKIM, DMARC                |
| Provider proposes too few times | Enforce minimum 3                         |
| Flow becomes slow               | No chat, no negotiation in MVP            |

---

## 26. Acceptance Criteria

1. New request is created with status `pending_provider_response`.
2. Provider receives automatic email.
3. Provider sees in-app badge for new request.
4. ۲۴ hour countdown is displayed for Provider response.
5. If Provider does not respond within ۲۴ hours, request becomes `expired`.
6. Provider must propose at least ۳ times.
7. Requester receives email and in-app notification after times are proposed.
8. Requester has ۴۸ hours to select one time.
9. Payment is disabled before time selection.
10. After time selection, status becomes `pending_payment`.
11. After successful payment, status becomes `confirmed`.
12. No request remains indefinitely pending.
13. Expired request shows ۳ تا ۵ similar experiences.
14. Similar experience UI does not show match, score or percentage wording.
15. SMTP email templates use the defined Persian copy.
16. Near-expiration warning is in-app only.
17. Reminder email is sent one hour before confirmed conversation.
18. Tests cover expiration, notifications, proposed times, payment gating and similar profiles.

---

## 27. Open Product Decisions

| Item                                                 | Needed Decision                                               |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| Payment expiry after `pending_payment`               | Not defined in BRD                                            |
| Exact near-expiration warning threshold              | Proposed as ۳ hours before expire                             |
| Request note max length                              | Not defined                                                   |
| Whether rejected requests show similar experiences   | BRD only specifies expired                                    |
| Whether requester can cancel after `pending_payment` | Included as state transition, cancellation policy not defined |
| Provider responsiveness ranking                      | Mentioned as future mitigation, not MVP algorithm             |

---

## 28. Final MVP Decision

Conversation Request Reliability System is required for Useravaa MVP.

Final MVP package:

```text
In-app status system
countdown
automatic SMTP transactional email
24h Provider SLA
48h Requester selection window
automatic expire
similar experiences after expire
payment only after selected time
no infinite pending requests
```

This capability protects the request-based model from dead requests, unclear waiting states and loss of trust.
