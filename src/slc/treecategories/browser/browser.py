from Products.Archetypes.Field import LinesField
from Products.Archetypes.interfaces import IBaseObject, IVocabulary, ISchema
from Products.Five.browser import BrowserView
from z3c.json.converter import JSONWriter
from zope.app.container.interfaces import IContainer
from zope.app.pagetemplate.simpleviewclass import simple
from zope.component import queryAdapter
from zope.interface import implements

from slc.treecategories.interfaces import IVocabularyInfo

class CustomKeyError(KeyError):
    """
    Use this class, if you don't want to return a 503 for an uncatched
    exception
    """
    pass

class GenericVocabularyInfo(object):
    implements(IVocabularyInfo)

    def __init__(self, *args, **kw):
        pass

    display_ids = False

class Json(object):
    """
    Simple view that returns a special formatted json representation
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
        adapter = queryAdapter(self, name=self.vocabulary.__name__)
        if not adapter:
            adapter = queryAdapter(self, name='generic')
        display_ids = adapter.display_ids

        return JSONWriter().write(self._convert(data, keyFilter,
                                                fullTextFilter, expanded,
                                                invert_key_limiter,
                                                display_ids))

    def _convert(self, input_dict, keyFilter, fullTextFilter,
                  expanded=False, invert_key_limiter=False, display_ids=False):
        """
        Recursively parse the dictionary as we get it from the
        IVocabulary, and transform it to a a dictionary as needed for
        dynatree
        """
        if input_dict == None:
            return None
        retval = []
        input_list = input_dict.items()
        input_list.sort(lambda a, b:cmp(a[1][0], b[1][0]))
        for key, (title, children) in input_list:
            # if we inverted the key limiter, we dont want a node to appear if
            # he is filtered, even if he has children!
            if invert_key_limiter and not keyFilter(key):
                continue
            children = self._convert(children, keyFilter, fullTextFilter 
                                     expanded, invert_key_limiter, display_ids)
            if not children and not keyFilter(key):
                continue
            if not children and not fullTextFilter(title):
                continue
            new_item = {}
            if display_ids:
                title = '%s (%s)' % (title, key)
            else:
                title = title
            new_item['title'] = title
            new_item['key'] = key
            new_item['children'] = children
            new_item['expand'] = expanded
            retval.append(new_item)
        return retval

class InlineTree(BrowserView):
    """
    A little view class just for ajax calls
    """
    @property
    def macros(self):
        return self.index.macros

    def __call__(self, add=None, remove=None, field=None):
        if add or remove:
            schema_field = ISchema(self.context)[field]
            values = list(schema_field.get(self.context))
            setter = schema_field.getMutator(self.context)
            controller = None
            displayList = None
            try:
                displayList = schema_field.vocabulary.getDisplayList(\
                    self.context)
                controller = lambda value: value in displayList
            except AttributeError:
                raise AttributeError("This Widget needs a vocabulary that "
                                     "implements IVocabulary")
            if add:
                if controller(add) and add not in values:
                    setter(values + [add])
                    self.context.reindexObject()
                return displayList.getValue(add)
            if remove:
                if remove in values:
                    values.remove(remove)
                    setter(values)
                    self.context.reindexObject()
                return displayList.getValue(remove)
        return super(BrowserView, self).__call__()
