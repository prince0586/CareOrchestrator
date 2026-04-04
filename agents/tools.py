import requests
from google.adk.tools import tool

@tool
def search_medical_knowledge(query: str) -> str:
    """Searches Wikipedia for medical information about conditions or treatments.
    
    Args:
        query: The medical term or condition to search for.
        
    Returns:
        A summary of the medical information found.
    """
    try:
        # Using Wikipedia API for real-time medical info
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return f"Wikipedia Summary for {query}: {data.get('extract', 'No summary available.')}"
        return f"Could not find Wikipedia information for '{query}'."
    except Exception as e:
        return f"Error searching Wikipedia: {str(e)}"

@tool
def query_knowledge_base(topic: str) -> str:
    """Queries the internal Healthcare Knowledge Base for policy and procedure info.
    
    Args:
        topic: The healthcare topic or policy to query.
        
    Returns:
        Relevant policy information or guidelines.
    """
    knowledge_base = {
        "appointment_policy": "Appointments must be cancelled at least 24 hours in advance to avoid a fee.",
        "insurance_preauth": "Pre-authorization typically takes 3-5 business days for non-emergency procedures.",
        "privacy": "All patient data is handled according to HIPAA regulations and encrypted at rest.",
        "cardiology": "Our cardiology department specializes in non-invasive diagnostics and preventive care."
    }
    return knowledge_base.get(topic.lower(), "Topic not found in local knowledge base. Please consult the Knowledge Agent for external search.")

@tool
def check_provider_calendar(specialty: str, preferred_date: str) -> str:
    """Checks the Electronic Health Record (EHR) system for provider availability.
    
    Args:
        specialty: The type of doctor or care required (e.g., 'cardiology', 'general practice').
        preferred_date: The date the patient wants to be seen.
        
    Returns:
        A string detailing available appointment slots.
    """
    # In a real production app, this would connect to an actual EHR API.
    return f"Found available slots for {specialty} on {preferred_date}: 10:00 AM, 2:00 PM."

@tool
def verify_insurance_eligibility(patient_name: str, insurance_id: str) -> str:
    """Verifies patient insurance eligibility and pre-authorization requirements with the payer.
    
    Args:
        patient_name: The full name of the patient.
        insurance_id: The patient's insurance policy ID.
        
    Returns:
        A string detailing the authorization status.
    """
    # In a real production app, this would call an insurance verification API.
    return f"Patient {patient_name} (ID: {insurance_id}) is eligible. Pre-auth submitted successfully."
