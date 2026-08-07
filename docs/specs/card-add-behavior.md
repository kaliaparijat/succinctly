### Problem
As a user on the last flashcard for a deck, I now have the option to add a new flashcard to this deck. Once the user adds a new flashcard and saves this card by clicking on the "Save Card" CTA or decides to cancel and clicks the "Cancel" CTA, they're navigated to the start of the deck and are shown the first card in the deck. This is not the correct experience, and a user has an expectation to see the card they just saved or if they did not save, then they should see the previous card.

### Requirements
1. Given that the user is on the decks/[id]/cards/new route 
   and the deck has at least one existing card
   when they click on the "Cancel" CTA
   then the user is navigated to the previous card. 

2. Given that the user is on the decks/[id]/cards/new route 
   and the deck has no existing card
   when they click on the "Cancel" CTA
   then the user is navigated to the /library route

3. Given that the user is on the decks/[id]/cards/new route 
   when they click on the "Save card" CTA
   and the card has been successfully saved to the database
   then the card is now the last card in this deck 
   then this card is displayed to the user on the decks/[id] route. 
