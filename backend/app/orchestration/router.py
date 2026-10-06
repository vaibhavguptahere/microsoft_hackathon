from app.schemas.routing import RoutingResult


def route_classification(result: RoutingResult):

    if result.status == "clarification_required":

        return {
            "action": "ask_clarification",
            "message": result.clarification_question,
            "routes": []
        }

    if result.status == "out_of_scope":

        return {
            "action": "out_of_scope",
            "message": (
                "I can currently assist with HR, IT, "
                "and Finance-related queries."
            ),
            "routes": []
        }

    routes = []

    for intent in result.intents:

        routes.append({
            "domain": intent.domain,
            "intent": intent.intent,
            "query": intent.query,
            "action": "retrieve_domain_knowledge"
        })

    return {
        "action": "route_to_domains",
        "routes": routes
    }