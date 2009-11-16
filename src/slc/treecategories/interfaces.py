from zope.interface import Interface
from zope.interface import Attribute
class IInlineTreeView(Interface):
    field = Attribute("The archetypes field")

class IVocabularyInfo(Interface):
    """ Marker interface 
    """
    show_ids = Attribute("Wheter to show id next to the title in the widget")