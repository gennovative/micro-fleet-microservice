# Gennova backend core library

# Versions
### 0.2.0
- **ConfigurationAdapter**: loads settings from remote Configuration Service, environment variables and appconfig.json file, respectedly. (100% covered)
- **Guard**: `assertDefined` makes sure provided argument is not null or undefined. (100% covered)
- **DependencyContainer**: manage dependencies between classes. (100% covered)
- **KnexDatabaseAdapter**: connect to database with Knex query builder library. (100% covered)
- **EntityBase**: abstract base class for models which are mapped to database tables. (100% covered)
- **RepositoryBase**: abstract base class for repository-pattern classes which use `EntityBase` models. (100% covered)
- **MicroServiceBase**: base class for all services' root class, the application is started from this class.
- **MessageBrokerAdapter**: just added, not working yet. (0% covered)

### 0.1.1
- Included pre-built `dist` folder.

### 0.1.0
- **ConfigurationAdapter**: loads settings from appconfig.json
- **ExpressHub**: Allows micro webs to plug in their routes and answer to requests.