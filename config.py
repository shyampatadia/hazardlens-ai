REMOTE_MODEL = "zai-org/GLM-5.3-Flash"
LOCAL_MODEL = "HuggingFaceTB/SmolVLM-500M-Instruct"
DETECTOR_MODEL = "google/owlvit-base-patch32"
LABEL_PROMPT = "Return only comma-separated singular names of physical objects for object detection. If the request names an object, return only that object. If it describes a hazard or relationship, return only visible objects causing it and exclude reference objects. Never return actions, conditions, adjectives, or scene descriptions. Return NONE if no object matches."
