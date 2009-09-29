from Products.Archetypes.interfaces import IBaseObject, IVocabulary
from Products.Five.browser import BrowserView
from z3c.json.converter import JSONWriter
from zope.app.pagetemplate.simpleviewclass import simple
from Products.Archetypes.Field import LinesField
from Products.Archetypes.interfaces import ISchema
from zope.app.container.interfaces import IContainer
#Not everything must be pluggable...

class CustomKeyError(KeyError):
    """
    Just for not returning a 503
    """
    pass

class Json(object):
    """Simple view that returns a special formatted json representation
    of the dictionary it adapts
    """

    def __init__(self, context, request):
        self.vocabulary = context
        self.request = request

    def __call__(self, key_limiter=None, invert_key_limiter=False,
                 full_text_filter=""):
        """
        key_limiter should be a list of keys, if set, only items that
        match an element of the key_limiter list, or that have children that
        match the key_limiter list, will be returned
        
        invert_key_limiter if set, only items, that are not in key_limiter and 
        their parents are not in key_limiter, will be returned
        
        full_text_filter searches througth the values, and applied the same 
        rule as the key_limiter. invert_key_limiter does not change the 
        full_text_limiter_behaviour
        """
        if key_limiter == None:
            keyFilter = lambda x: True
        else:
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
                  expanded=False, invert_key_limiter=False):
        """Recursively parse the dictionary as we get it from the
           IVocabulary, and transform it to a a dictionary as needed for
           dynatree
           
        """
        if input_dict == None:
            return None
        retval = []
        for key, (title, children) in input_dict.items():
            # if we inverted the key limiter, we dont want a node to appear if he
            # is filtered, even if he has children!
            if invert_key_limiter and not keyFilter(key):
                continue
            children = self._convert(children, keyFilter, fullTextFilter, expanded, invert_key_limiter)
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

class TreeMacros(BrowserView):

    @property
    def macros(self):
        return self.index.macros

class InlineTree(BrowserView):
    @property
    def macros(self):
        return self.index.macros

    def __call__(self, add=None, remove=None, field=None):
        if add or remove:
            _f = ISchema(self.context)[field]
            values = list(_f.get(self.context))
            setter = lambda x: _f.set(self.context, x)
            controller = None
            displayList = None
            try:
                displayList = _f.vocabulary.getDisplayList(self.context)
                controller = lambda value: value in displayList
            except AttributeError:
                raise AttributeError("This Widget needs a vocabulary that implements IVocabulary")
            if add:
                if controller(add) and add not in values:
                    setter(values + [add])
                    self.context.reindexObject()
                return displayList.getValue(add)
            if remove:
                if controller(remove) and remove in values:
                    values.remove(remove)
                    setter(values)
                    self.context.reindexObject()
                return displayList.getValue(remove)
        return super(BrowserView, self).__call__()


class MassCategorizer(BrowserView):

    @property
    def title(self):
        return self.context.title_or_id()

    def __call__(self, change_categories=False, added_category="",
                 removed_category="", ids=[], vocabulary_name=''):
        if change_categories:
            for id in ids:
                obj = self.context[id]
                if IBaseObject.providedBy(obj):
                    for field in ISchema(obj).fields():
                        vocabulary = getattr(field, 'vocabulary', None)
                        if vocabulary and IVocabulary.providedBy(vocabulary) and\
                            hasattr(vocabulary, 'vocab_name'):
                            if added_category not in vocabulary.getDisplayList(self.context):
                                self.request.response.setStatus(500)
                                raise CustomKeyError('Not in list')
                            if vocabulary.vocab_name == vocabulary_name:
                                entries = field.get(obj)
                                if added_category not in entries:
                                    entries = entries + (added_category,)
                                    field.set(obj, entries)
            return ""

        return self.index()

    @property
    def items(self):
        retval = []
        for id, item in self.context.items():
            if IBaseObject.providedBy(item):
                retval_item = {}
                retval_item['id'] = id
                retval_item['title'] = item.title_or_id()
                retval_item['description'] = item.description
                categories = []
                retval_item['categories'] = categories
                for field in ISchema(item).fields():
                    if not isinstance(field, LinesField):
                        continue
                    vocabulary = getattr(field, 'vocabulary', None)
                    if vocabulary and IVocabulary.providedBy(vocabulary) and\
                        hasattr(vocabulary, 'vocab_name') and\
                        hasattr(vocabulary, 'getVocabulary'):
                        display_helper = vocabulary.getDisplayList(self.context)
                        category = {}
                        category['name'] = vocabulary.getVocabulary(self.context).title
                        data = []
                        category['data'] = data
                        for key in field.get(item):
                            key_data = {}
                            key_data['key'] = key
                            key_data['value'] = display_helper.getValue(key)
                            data.append(key_data)
                        categories.append(category)
                        data.sort(key=lambda item:item['value'])
                retval.append(retval_item)
        return retval



