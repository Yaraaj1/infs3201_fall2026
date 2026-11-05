
# Database Conversion Documentation

## LLM Used

ChatGPT by OpenAI (GPT-6)

## Prompts Used

1. Help me create a one-time MongoDB migration script to replace application-generated customerId, serviceId, and orderId fields with MongoDB's built-in _id identifiers.

2. Help me update the order documents so that customerId references the customer's MongoDB _id and each item's serviceId references the service's MongoDB _id.

3. Help me validate the database references before performing the migration to ensure that all customer and service references exist.

4. Help me use a MongoDB transaction to perform the migration safely and avoid partial updates if an error occurs.

5. Help me refactor the application's persistence layer to retrieve customers, services, and orders using MongoDB ObjectIds instead of the old application-generated identifiers.

## Follow-up Prompts

1. Help me correct the migration script to follow the course coding guidelines: no arrow functions, no built-in array iteration methods, regular function declarations, and regular loops.

2. Help me verify that the migration script checks whether the database has already been migrated before making changes.

3. Help me update the business logic to compare MongoDB ObjectIds instead of the old application-generated service identifiers.

4. Help me update the Handlebars views to display MongoDB _id values instead of the old application-generated identifiers.

5. Help me check the remaining application files for references to the old identifiers after the database migration.
