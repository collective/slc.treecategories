from Products.ATVocabularyManager.utils.vocabs import createHierarchicalVocabs
from Products.CMFCore.utils import getToolByName
from Products.GenericSetup.utils import _getDottedName
from plone.app.portlets.storage import PortletAssignmentMapping
from plone.portlets.interfaces import IPortletAssignment, IPortletDataProvider, \
    IPortletManager, IPortletRenderer, IPortletType
from slc.treecategories.portlets import tree_portlet
from slc.treecategories.tests.base import PortletsTestCase
from zope.app.component.hooks import setHooks, setSite
from zope.component import getUtility, getMultiAdapter #@UnresolvedImport

class TestPortlet(PortletsTestCase):

    def afterSetUp(self):
        setHooks()
        setSite(self.portal)
        self.setRoles(('Manager',))

    def testPortletTypeRegistered(self):
        portlet = getUtility(IPortletType, name='slc.treecategories.portlet')
        self.assertEquals(portlet.addview, 'slc.treecategories.portlet')

    def testRegisteredInterfaces(self):
        portlet = getUtility(IPortletType, name='slc.treecategories.portlet')
        registered_interfaces = [_getDottedName(i) for i in portlet.for_]
        registered_interfaces.sort()
        self.assertEquals(['plone.app.portlets.interfaces.IColumn',
          'plone.app.portlets.interfaces.IDashboard'],
          registered_interfaces)

    def testInterfaces(self):
        portlet = tree_portlet.Assignment("")
        self.failUnless(IPortletAssignment.providedBy(portlet))
        self.failUnless(IPortletDataProvider.providedBy(portlet.data))

    def testInvokeAddview(self):
        portlet = getUtility(IPortletType, name='slc.treecategories.portlet')
        mapping = self.portal.restrictedTraverse('++contextportlets++plone.leftcolumn')
        for m in mapping.keys():
            del mapping[m]
        addview = mapping.restrictedTraverse('+/' + portlet.addview)

        addview.createAndAdd(data={'tree_name' : 'test'})

        self.assertEquals(len(mapping), 1)
        self.failUnless(isinstance(mapping.values()[0], tree_portlet.Assignment))
        self.failUnlessEqual('test', mapping.values()[0].tree_name)

    def testInvokeEditView(self):
        mapping = PortletAssignmentMapping()
        request = self.folder.REQUEST

        mapping['foo'] = tree_portlet.Assignment("")
        editview = getMultiAdapter((mapping['foo'], request), name='edit')
        self.failUnless(isinstance(editview, tree_portlet.EditForm))

    def testRenderer(self):
        context = self.folder
        request = self.folder.REQUEST
        view = self.folder.restrictedTraverse('@@plone')
        manager = getUtility(IPortletManager, name='plone.rightcolumn', context=self.portal)
        assignment = tree_portlet.Assignment("test")

        renderer = getMultiAdapter((context, request, view, manager, assignment), IPortletRenderer)
        self.failUnless(isinstance(renderer, tree_portlet.Renderer))
        self.failUnless(assignment.title.endswith('test'), '%s does not end with test' % assignment.title)
        self.failUnless('test', renderer.name)

class TestRenderer(PortletsTestCase):

    def afterSetUp(self):
        setHooks()
        setSite(self.portal)

    def renderer(self, context=None, request=None, view=None, manager=None, assignment=None):
        context = context or self.portal
        request = request or self.app.REQUEST
        atvm = getToolByName(context, 'portal_vocabularies')
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

        createHierarchicalVocabs(atvm, hierarchicalVocabs)


        view = view or self.portal.restrictedTraverse('@@plone')
        manager = manager or getUtility(IPortletManager, name='plone.rightcolumn', context=self.portal)
        assignment = assignment or tree_portlet.Assignment()
        return getMultiAdapter((context, request, view, manager, assignment), IPortletRenderer)


def test_suite():
    from unittest import TestSuite, makeSuite
    suite = TestSuite()
    suite.addTest(makeSuite(TestPortlet))
    suite.addTest(makeSuite(TestRenderer))
    return suite
