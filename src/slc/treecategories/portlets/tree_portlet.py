'''
Created on Jun 3, 2009

@author: patrick
'''
from Acquisition import aq_inner
from Products.CMFCore.utils import getToolByName
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from plone.app.portlets.portlets import base
from plone.memoize.instance import memoize
from plone.portlets.interfaces import IPortletDataProvider
from slc.treecategories import TreeCategoriesMessageFactory as _
from zope import schema
from zope.component import getMultiAdapter #@UnresolvedImport
from zope.formlib import form
from zope.interface import implements
import logging

logger = logging.getLogger('slc.treecategories')
class ITreeCategoriesPortlet(IPortletDataProvider):
    
    tree_name = schema.TextLine(title=_('The category to display'),
                                description=_('The category to display'),
                                required=True)
    
class Assignment(base.Assignment):
    implements(ITreeCategoriesPortlet)
    
    def __init__(self, tree_name):
        self.tree_name = tree_name
        
    @property
    def title(self):
        return _('Categories of %s') % self.tree_name
    
class Renderer(base.Renderer):
    _template = ViewPageTemplateFile('trees.pt')
    
    def __init__(self, *args):
        base.Renderer.__init__(self, *args)

        context = aq_inner(self.context)
        portal_state = getMultiAdapter((context, self.request),
                                       name=u'plone_portal_state')
        self.anonymous = portal_state.anonymous()
        self.portal_url = portal_state.portal_url()
        self.name = self.data.tree_name
        self.title = self.data.title
        
    def render(self):
        return self._template()

    @property
    def available(self):
        return not self.anonymous
    
class AddForm(base.AddForm):
    form_fields = form.Fields(ITreeCategoriesPortlet)
    label = _(u"Add Category Portlet")
    description = _(u"This portlet displays category items.")

    def create(self, data):
        return Assignment(data.get('tree_name'))

class EditForm(base.EditForm):
    form_fields = form.Fields(ITreeCategoriesPortlet)
    label = _(u"Edit Category Portlate")
    description = _(u"This portlet displays a defined category.")
