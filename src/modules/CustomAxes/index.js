export function isVisibleAxeDragItemMenuOption(props) {
  const { optionName, config, field, componentType } = props;

  switch (optionName) {
    case 'renderAddToTableToggle':
    case 'renderAddToTooltipToggle':
    case 'renderAggregationForSortBy':
    case 'renderAggregationMenuItem':
    case 'renderCalcHideResult':
    case 'renderCalcLevel':
    case 'renderColorBySelector':
    case 'renderColorFromDataToggle':
    case 'renderControllingFilterMenuItem':
    case 'renderDerivedFieldToggle':
    case 'renderDerivedFilterFieldSelector':
    case 'renderDoShowTitleCheckbox':
    case 'renderDrillLevelOnly':
    case 'renderEditCalcMenuItem':
    case 'renderFilterLevel':
    case 'renderFilterSqlType':
    case 'renderListFieldSelector':
    case 'renderMdxLevelSelector':
    case 'renderNameBy':
    case 'renderOrderIndexSelector':
    case 'renderPillType':
    case 'renderSheetSelector':
    case 'renderSortBySelector':
    case 'renderSortMenuItem':
    case 'renderSubAllAggregationMenuItem':
    case 'renderTitleInput':
    case 'renderTooltipBy':
    default:
      return false;
  }
}

export function isVisibleAxeDragItemElement(props) {
  const { elementName, componentType, config, field } = props;
  switch (elementName) {
    case 'renderSortSelector':
    case 'renderAggregationSelector':
    default:
      return false;
  }
}

export function isVisibleAxe(props) {
  const { axe, config } = props;

  return true;
}

export function sortAxes(props) {
  const { config, component, axisNames } = props;

  return [];
}

export function isDisabledAxe(props) {
  const { axe, field, fieldIndex, config, componentType } = props;

  return false;
}

export function getAxeName(props) {
  const { axe, config, componentType, axisNames } = props;

  let axisName = axisNames[axe.type];

  return axisName;
}

export function isVisibleField(props) {
  const { axe, field, config, componentType } = props;

  return true;
}

export function renderAxeIcon(props) {
  const { axe, field, config, componentType, axisNames, HsMuiFontIcon, HsMuiSvgIcon } = props;

  const icons = {
    categories: (
      <HsMuiFontIcon className='fa fa-bars' title={axisNames.categories} style={{ transform: 'rotate(90deg)' }} />
    ),
    values: <HsMuiFontIcon className='fa fa-bars' title={axisNames.values} />,
  };

  return icons[axe.type];
}

export function getAxeIconColor(props) {
  const { axe, field, config, componentType } = props;

  const iconColors = {
    columns: 'white', //#e8f5e9
    rows: 'white', //#e1f5fe
    values: 'white',
  };
  return iconColors[axe.type] || 'white';
}

export function renderAxeToggle(props) {
  const { axe, field, config, componentType, valuesToggle, seriesToggle } = props;

  switch (axe.type) {
    case 'values':
      return valuesToggle;
    case 'series':
      return seriesToggle;
    case 'dimension':
    case 'categories':
    case 'filters':
    default:
      return null;
  }
}

export default {
  isVisibleAxeDragItemMenuOption,
  isVisibleAxeDragItemElement,
  isVisibleAxe,
  sortAxes,
  isDisabledAxe,
  getAxeName,
  isVisibleField,
  renderAxeIcon,
  getAxeIconColor,
  renderAxeToggle,
};
