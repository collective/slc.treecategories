from Products.Archetypes import Widget
from Products.Archetypes.Registry import registerWidget
from Products.Five.browser import BrowserView
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from slc.treecategories.interfaces import IInlineTreeView
from zope.component import getMultiAdapter
from zope.interface import implements

class TreeWidget(Widget.InAndOutWidget):
    _properties = Widget.InAndOutWidget._properties.copy() #@UndefinedVariable
    _properties.update({
        'macro' : "at_widget_tree",
        })

registerWidget(TreeWidget,
               title='Tree',
               description=('Renders a widget for moving items '
                            'from one tree to another. Items are '
                            'removed from the first tree.'),
               used_for=('Products.Archetypes.Field.LinesField',)
               )

class InlineTreeWidget(TreeWidget):
    _properties = TreeWidget._properties.copy()
    _properties.update({'macro' : 'at_widget_inlinetree'})

registerWidget(InlineTreeWidget,
               title='Inline Tree',
               description=('Renders a widget with selected items '
                            'Allows selection of more items via pop up'),
               used_for=('Products.Archetypes.Field.LinesField',)
               )

def getInlineTreeView(context, request, field):
    retval = getMultiAdapter((context, request), name='slc.treecategories.inlinetreeview')
    retval._field = field
    return retval

class InlineTreeView(BrowserView):
    implements(IInlineTreeView)

    _field = None
    @property
    def field(self):
        return self._field

    @property
    def items(self):
        return self.field.get(self.context)

    @property
    def fieldName(self):
        return self.field.getName()
    @property
    def widget(self):
        return self.field.widget
    
    #property
    def portal(self):
        return self.context
    
    errors = {}

    render = ViewPageTemplateFile("../browser/inlinetree.pt")
