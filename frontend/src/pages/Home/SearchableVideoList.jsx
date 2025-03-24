import { useState } from 'react';
import VideoList from './VideoList';

function SearchableVideoList({ videos }) {
  const [searchText, setSearchText] = useState('');
  return (
    <>
      <VideoList
        videos={videos}
        emptyHeading={`No matches for “${searchText}”`} />
    </>
  );
}

export default SearchableVideoList;