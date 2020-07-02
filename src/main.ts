import { WebhookPayloadWithRepository } from 'actions-toolkit/lib/context'
import { Exit } from 'actions-toolkit/lib/exit'
import { LoggerFunc, Signale } from 'signale'
import {
  Rule,
  IssuesListLabelsOnIssueParams,
  IssuesListLabelsOnIssueResponse,
  PullsListReviewsParams,
  PullsListReviewsResponse,
} from './types'

// Get the maximum number of reviews based on the configuration and the issue labels
export const getRulesForLabels = async (
  issuesListLabelsOnIssueParams: IssuesListLabelsOnIssueParams,
  client,
  rules: Rule[]
): Promise<Rule[]> => {
  return client.issues
    .listLabelsOnIssue(issuesListLabelsOnIssueParams)
    .then(({ data: labels }: IssuesListLabelsOnIssueResponse) => {
      return labels.reduce((acc, label) => acc.concat(label.name), [])
    })
    .then((issueLabels: string[]) =>
      rules.filter((rule) => issueLabels.includes(rule.label))
    )
}

// Get the maximum number of reviews based on the configuration and the issue labels
export const getMaxReviewNumber = (rules: Rule[]): number =>
  rules.reduce((acc, rule) => (rule.reviews > acc ? rule.reviews : acc), 0)

// Returns the repository information using provided gitHubEventPath
export const findRepositoryInformation = (
  gitHubEventPath: string,
  log: LoggerFunc & Signale,
  exit: Exit
): IssuesListLabelsOnIssueParams => {
  const payload: WebhookPayloadWithRepository = require(gitHubEventPath)
  if (payload.pull_request?.number === undefined) {
    exit.neutral(
      'Action not triggered by a PullRequest review action. PR ID is missing'
    )
  }
  log.info(`Checking labels for PR#${payload.pull_request.number}`)
  return {
    issue_number: payload.pull_request.number,
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
  }
}

// Get the current review count from an issue
export const getCurrentReviewCount = async (
  pullsListReviewsParams: PullsListReviewsParams,
  client
): Promise<number> => {
  return client.pulls
    .listReviews(pullsListReviewsParams)
    .then(({ data: reviews }: PullsListReviewsResponse) => {
      return reviews.reduce(
        (acc, review) => (review.state === 'APPROVED' ? acc + 1 : acc),
        0
      )
    })
}
