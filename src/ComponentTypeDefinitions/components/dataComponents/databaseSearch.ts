import makeComponent from '../../../utils/makeComponent';

interface DatabaseSearchData {
}

const DatabaseSearch = makeComponent<DatabaseSearchData>({
  name: 'Database search form',
  subFields: {},
});

export default DatabaseSearch;
