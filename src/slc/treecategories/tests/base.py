"""Base class for integration tests, based on ZopeTestCase and PloneTestCase.

Note that importing this module has various side-effects: it registers a set of
products with Zope, and it sets up a sandbox Plone site with the appropriate
products installed.
"""
from Products.PloneTestCase.PloneTestCase import FunctionalTestCase, \
    PloneTestCase, setupPloneSite
from Products.PloneTestCase.layer import onsetup
from Testing import ZopeTestCase
from Products.Five import fiveconfigure, zcml


# Import PloneTestCase - this registers more products with Zope as a side effect

# Set up a Plone site - note that the portlets branch of CMFPlone applies
# a portlets profile.
ZopeTestCase.installProduct('ATVocabularyManager')

@onsetup
def setup():
    fiveconfigure.debug_mode = True
    import slc.treecategoriesexample
    import slc.treecategories
    zcml.load_config('configure.zcml', slc.treecategoriesexample)
    zcml.load_config('configure.zcml', slc.treecategories)
    fiveconfigure.debug_mode = False
    ZopeTestCase.installPackage('slc.treecategoriesexample')

setup()
setupPloneSite(products=['slc.treecategories', 'Products.ATVocabularyManager', 'slc.treecategoriesexample'])

class PortletsTestCase(PloneTestCase):
    """Base class for integration tests for plone.app.portlets. This may
    provide specific set-up and tear-down operations, or provide convenience
    methods.
    """

class PortletsFunctionalTestCase(FunctionalTestCase):
    """Base class for functional integration tests for plone.app.portlets. 
    This may provide specific set-up and tear-down operations, or provide 
    convenience methods.
    """
