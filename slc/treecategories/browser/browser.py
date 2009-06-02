from Products.Archetypes.interfaces import IVocabulary
from z3c.json.converter import JSONWriter
from zope.app.pagetemplate.simpleviewclass import simple

#Not everything must be pluggable...

class Json(object):
    """Simple view that returns a special formatted json representation
    of the dictionary it adapts
    """

    def __init__(self, context, request):
        self.vocabulary = IVocabulary(context)
        self.request = request

    def __call__(self, key_limiter = [], invert_key_limiter = False, 
                 full_text_filter = ""):
        keyFilter = key_limiter.__contains__
        if invert_key_limiter:
            keyFilterOriginal = keyFilter
            keyFilter = lambda key: not keyFilterOriginal(key)
        
        full_text_filter = full_text_filter.upper()
        fullTextFilter = lambda value: full_text_filter in value.upper()
        
        expanded = False
        if full_text_filter:
            expanded = True
        
        data = self.vocabulary.getVocabularyDict(None)

        return JSONWriter().write(self._convert(data, keyFilter, 
                                                fullTextFilter, expanded, 
                                                invert_key_limiter))

    def _convert(self, input_dict, keyFilter, fullTextFilter, 
                  expanded = False, invert_key_limiter = False):
        """Recursively parse the dictionary as we get it from the
           IVocabulary, and transform it to a a dictionary as needed for
           dynatree"""
        if input_dict == None:
            return None
        retval = []
        for key, (title, children) in input_dict.items():
            # if we inverted the key limiter, we dont want a node to appear if he
            # is filtered, even if he has children!
            if invert_key_limiter and not keyFilter(key):
                continue
            children = self._convert(children, keyFilter, fullTextFilter, expanded)
            if not children and not keyFilter(key):
                continue
            if not children and not fullTextFilter(title):
                continue
            new_item = {}
            new_item['title'] = title
            new_item['key'] = key
            new_item['children'] = children
            new_item['expand'] = expanded
            retval.append(new_item)
        return retval
    
class TreeMacros(simple):

    @property
    def macros(self):
        return self.index.macros
    

