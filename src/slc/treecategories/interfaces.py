from zope.interface import Interface
from zope.interface import Attribute
class IInlineTreeView(Interface):
    field = Attribute("The archetypes field")
