import * as cm from '@micro-fleet/common'

const D = cm.constants.DbSettingKeys
const M = cm.constants.MbSettingKeys
const S = cm.constants.SvcSettingKeys

export = {
    D, M, S, // Dummy exports, just to avoid errors when generating definition
    [S.DEADLETTER_TIMEOUT]: 10000,
    [S.SERVICE_SLUG]: 'micro_service_great_grand_father',
    [S.CONFIG_SERVICE_ADDRESSES]: ['127.0.0.1', '127.0.0.2', '127.0.0.3'],
    [D.DB_ENGINE]: cm.constants.DbClient.POSTGRESQL,
    [D.DB_ADDRESS]: 'localhost',
    [D.DB_USER]: 'postgres',
    [D.DB_PASSWORD]: 'postgres',
    [D.DB_NAME]: 'postgres',
    [M.MSG_BROKER_HOST]: '127.0.0.1',
    [M.MSG_BROKER_RECONN_TIMEOUT]: 3000,
    [M.MSG_BROKER_USERNAME]: 'firstidea',
    [M.MSG_BROKER_PASSWORD]: 'gennova',
    [M.MSG_BROKER_EXCHANGE]: 'first-infras',
    [M.MSG_BROKER_HANDLER_QUEUE]: 'first-handler',
    [M.MSG_BROKER_MSG_EXPIRE]: 5000,
}
