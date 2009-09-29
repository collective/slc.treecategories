from Products.ATVocabularyManager.utils.vocabs import createHierarchicalVocabs
from Products.Archetypes.Field import LinesField
from Products.Archetypes.interfaces import IBaseObject, ISchema, IField, \
    IVocabulary
from Products.CMFCore.utils import getToolByName
from slc.treecategories.tests.base import PortletsTestCase
from zope.app.component.hooks import setHooks, setSite
from zope.app.container.interfaces import IContainer
from zope.component import getMultiAdapter #@UnresolvedImport
from zope.interface import implements
from zope.publisher.browser import TestRequest




class TestViews(PortletsTestCase):

    def afterSetUp(self):
        setHooks()
        setSite(self.portal)
        self.setRoles(('Manager',))
        self.atvm = getToolByName(self.portal, 'portal_vocabularies')
        hierarchicalVocabs = {}

        hierarchicalVocabs[('exampletags', 'Just a bunch of tags')] = {
            ('aut', 'Austria'): {
                ('tyr', 'Tyrol'): {
                    ('auss', 'Ausserfern'): {},
                }
            },
            ('ger', 'Germany'): {
                ('bav', 'Bavaria'):{}
            },
        }

        createHierarchicalVocabs(self.atvm, hierarchicalVocabs)
        self.city = self.portal.get(self.portal.invokeFactory('City', 'test1',
                                              title='test_title',
                                              description='test_description'))
        display_helper = self.city.getField('tags').vocabulary.getDisplayList(self.portal)
        self.city.tags = [display_helper.getKey(x) for x in ('Austria - Tyrol', 'Germany')]

class TestJSONView(PortletsTestCase):

    def afterSetUp(self):
        setHooks()
        setSite(self.portal)
        self.setRoles(('Manager',))

        self.atvm = getToolByName(self.portal, 'portal_vocabularies')
        hierarchicalVocabs = {}

        hierarchicalVocabs[('regions', 'Some regions in europe')] = {
            ('aut', 'Austria'): {
                ('tyr', 'Tyrol'): {
                    ('auss', 'Ausserfern'): {},
                }
            },
            ('ger', 'Germany'): {
                ('bav', 'Bavaria'):{}
            },
        }

        createHierarchicalVocabs(self.atvm, hierarchicalVocabs)

    def test_jsonNoFilterView(self):
        view = self.portal.restrictedTraverse('portal_vocabularies/regions/json')
        retval = view()
        self.assertEquals(449, len(retval))

    def test_jsonSimpleFilterView(self):
        view = self.portal.restrictedTraverse('portal_vocabularies/regions/json')
        key = [self.atvm['regions'].getVocabularyDict().keys()[0]]
        retval = view(key_limiter=key)
        self.assertEquals(91, len(retval))

    def test_jsonSimpleInversedFilterView(self):
        view = self.portal.restrictedTraverse('portal_vocabularies/regions/json')
        key = [self.atvm['regions'].getVocabularyDict().keys()[0]]
        retval = view(key_limiter=key, invert_key_limiter=True)
        self.assertEquals(180, len(retval))

    def test_jsonDeepSimpleFilterView(self):
        view = self.portal.restrictedTraverse('portal_vocabularies/regions/json')
        key = self.atvm['regions'].getVocabularyDict().values()[0][1].keys()
        retval = view(key_limiter=key)
        self.assertEquals(178, len(retval))

    def test_jsonDeepSimpleInversedFilterView(self):
        view = self.portal.restrictedTraverse('portal_vocabularies/regions/json')
        key = self.atvm['regions'].getVocabularyDict().values()[0][1].keys()
        retval = view(key_limiter=key, invert_key_limiter=True)
        self.assertEquals(270, len(retval))

    def test_jsonFulltextView(self):
        view = self.portal.restrictedTraverse('portal_vocabularies/regions/json')
        retval = view(full_text_filter='Tyrol')
        self.assertEquals(176, len(retval))

def test_suite():
    from unittest import TestSuite, makeSuite
    suite = TestSuite()
    suite.addTest(makeSuite(TestViews))
    suite.addTest(makeSuite(TestJSONView))

    return suite
