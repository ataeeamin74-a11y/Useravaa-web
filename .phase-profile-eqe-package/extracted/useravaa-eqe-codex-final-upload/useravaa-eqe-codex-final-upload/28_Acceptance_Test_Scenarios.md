# Acceptance Test Scenarios

## Publish without Admin
Given Provider has an active question
When Provider writes a valid answer
And accepts responsibility
And clicks انتشار در پروفایل
Then answer status becomes published
And answer appears in «از تجربه من».

## Block without responsibility
Given Provider has a valid draft answer
When Provider clicks publish without accepting responsibility
Then publication is blocked.

## Retract
Given Provider has a published answer
When Provider retracts it
Then answer status becomes retracted
And it is removed from the public profile.
