from Products.CMFPlone.CatalogTool import registerIndexableAttribute
from Products.Archetypes.interfaces import IBaseContent
from Products.Archetypes.interfaces._vocabulary import IVocabulary

from zope.i18nmessageid import MessageFactory

TreeCategoriesMessageFactory = MessageFactory('slc.treecategories')

def getPath(uid, dict_, path=[]):
    dict_ = dict_[1]
    if not dict_:
        return dict_
    if uid in dict_.keys():
        return path + [uid]
    for path_elem, subdict in dict_.items():
        retval = getPath(uid, subdict, path + [path_elem])
        if retval:
            return retval
    return []

def indexTree(obj, portal, vars=None):
    if not IBaseContent.providedBy(obj):
        # No archetypes, no support
        raise AttributeError
    for field in obj.schema.fields():
        if not IVocabulary.providedBy(field.vocabulary):
            # Wrong vocabulary type
            continue
        termUIDs = field.getRaw(obj)
        if not isinstance(termUIDs, list):
            termUIDs = [termUIDs]
        all_dicts = field.vocabulary.getVocabularyDict(obj)
        path = []
        for term in termUIDs:
            path.extend(getPath(term, ('', all_dicts)))
        return path



def initialize(context):
    registerIndexableAttribute('tree_categories', indexTree)
