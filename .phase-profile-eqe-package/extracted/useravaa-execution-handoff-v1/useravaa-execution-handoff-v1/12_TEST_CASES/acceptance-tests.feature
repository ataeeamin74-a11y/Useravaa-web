Feature: Useravaa MVP critical flows

  Scenario: Build an experience profile with capped pricing
    Given an authenticated user is on the build experience profile page
    When the user fills required profile fields
    And selects "کارشناس ارشد" as رده سازمانی
    And sets 30 minute price to 500000
    And sets 60 minute price to 900000
    And submits the profile
    Then the profile status should be "pending_review"

  Scenario: Reject price above cap
    Given an authenticated user is building an experience profile
    When the user selects "کارشناس ارشد"
    And sets 30 minute price above 500000
    Then the profile form should show "PRICE_CAP_EXCEEDED"
    And the submit action should be disabled

  Scenario: Enable free help
    Given an authenticated user is building an experience profile
    When the user enables "کمک رایگان"
    Then both price fields should be set to 0
    And both price fields should be disabled
    And the profile preview should display "رایگان"

  Scenario: Request then schedule conversation
    Given a seeker is viewing an active experience profile
    When the seeker creates a 30 minute conversation request
    Then the request status should be "requested"
    When the provider proposes 3 unique times
    Then the request status should be "provider_time_options_sent"
    When the seeker selects one proposed time
    Then checkout should be created

  Scenario: Block payout without settlement info
    Given a provider has available payout
    And no settlement information is registered
    When the provider requests payout
    Then payout should not be created
    And the settlement information form should be displayed

  Scenario: Save valid settlement info
    Given a provider opens settlement settings
    When they enter account owner name
    And a Shaba matching "IR" plus 24 digits
    Then settlement info should be saved
    And payout request should be allowed
