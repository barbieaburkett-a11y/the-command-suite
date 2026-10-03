import { projectTypeGroups } from './project-types';

export function ProjectTypeSelect({name='projectTypeKey',defaultValue='',required=true}:{name?:string;defaultValue?:string;required?:boolean}) {
  return <select name={name} defaultValue={defaultValue} required={required}>
    <option value="">{required ? 'Select a project type' : 'Needs classification'}</option>
    {projectTypeGroups.map(group => <optgroup key={group.key} label={group.label}>
      {group.options.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
    </optgroup>)}
  </select>;
}
