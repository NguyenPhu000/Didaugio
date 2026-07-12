import { memo } from "react";
import { View } from "react-native";
import { SearchOverlay } from "./SearchOverlay";
import FilterGroupBar from "./filters/FilterGroupBar";

const MapTopControls = memo(function MapTopControls({
  searchState,
  searchHandlers,
  filterState,
  filterHandlers,
  onLayout,
}) {
  return (
    <View pointerEvents="box-none" style={{ gap: 10 }} onLayout={onLayout}>
      <SearchOverlay
        searchOpen={searchState.open}
        searchText={searchState.text}
        setSearchText={searchHandlers.setText}
        openSearch={searchHandlers.open}
        closeSearch={searchHandlers.close}
        searchInputRef={searchState.inputRef}
        currentUserAvatarUri={searchState.currentUserAvatarUri}
        onAvatarPress={searchHandlers.avatarPress}
      />

      {!searchState.open ? (
        <FilterGroupBar
          activeFilterGroup={filterState.activeFilterGroup}
          onSelectFilterGroup={filterHandlers.selectFilterGroup}
          activeFilterGroupMeta={filterState.activeFilterGroupMeta}
          activeFilterSummaryLabel={filterState.activeFilterSummaryLabel}
          onOpenFilterPicker={filterHandlers.openFilterPicker}
        />
      ) : null}
    </View>
  );
});

export default MapTopControls;
