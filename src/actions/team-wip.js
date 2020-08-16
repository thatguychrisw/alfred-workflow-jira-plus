import alfy from 'alfy'
import makeJiraService from '../services/jira'
import { getEnv, getJiraCredentials } from '../helpers'

/**
 * @param {{title: string}, {url: string}, {assignee: object}} issue
 * @returns {{mods: {alt: {subtitle: string}}, subtitle: *, arg: *, title: string}}
 */
const mapIssueToAlfyOutput = (issue) => ({
      title: issue.title,
      subtitle: `Assigned to ${issue.assignee.displayName}`,
      arg: issue.url,
      mods: {
          alt: {
              subtitle: issue.url
          }
      }
  })

;(async () => {
    const service = makeJiraService(...getJiraCredentials())

    const members = await service.getUserAccountIds(getEnv('jira_teammates').split(','))

    if (members) {
        let issues = alfy.cache.get('team-wip')
        if (!issues) {
            const criteria = `
            sprint in openSprints() and 
            status not in ("To Do", "Pending Release", "Done") and
            assignee IN (${Object.values(members).join(',')})`

            issues = await service.getIssues(criteria, ['summary', 'key', 'assignee'])

            alfy.cache.set('team-wip', issues, {maxAge: 900000}) // 15m
        }

        return alfy.output(issues.map(mapIssueToAlfyOutput))
    }
})()