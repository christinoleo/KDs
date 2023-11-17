from dotenv import load_dotenv
from app.api import test, custom, schema
from app.api.knowledge import knowledge
from app.api.nlp import nlp
import os

#


def include_routers(app):
    load_dotenv()
    app.include_router(test.router)
    app.include_router(custom.router)
    app.include_router(schema.router)
    app.include_router(knowledge.router)
    if os.environ.get("PPT_API", False) == "True":
        print("enable PPT")
        from app.api.ppt import ppt

        app.include_router(ppt.router)
    app.include_router(nlp.router)
