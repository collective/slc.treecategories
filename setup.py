from setuptools import setup, find_packages
import os

version = '0.5.0b6dev'

setup(name='slc.treecategories',
      version=version,
      description="Support for tree categories",
      long_description=open("README.rst").read() + "\n" +
                       open(os.path.join("CHANGES.txt")).read(),
      # Get more strings from http://www.python.org/pypi?%3Aaction=list_classifiers
      classifiers=[
        "Framework :: Plone",
        "Programming Language :: Python",
        "Development Status :: 3 - Alpha",
        "License :: OSI Approved :: GNU General Public License (GPL)"
        ],
      keywords='dynatree, jqueryui',
      author='Patrick Gerken',
      author_email='gerken@syslab.com',
      url='http://www.syslab.com',
      license='GPL',
      packages=find_packages('src'),
      package_dir={'' : 'src'},
      namespace_packages=['slc'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'collective.js.jqueryui',
          'z3c.json',
          'zope.app.pagetemplate',
          'Products.ATVocabularyManager'
          # -*- Extra requirements: -*-
      ],
      extras_require=dict(test=['slc.treecategoriesexample']),
      entry_points="""
      # -*- Entry points: -*-

      """,
      )
