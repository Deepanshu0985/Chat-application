const { client, isRedisConnected } = require("../config/connectToRedis")

const saveGlobalAlertToRedis = async (data, userIdsArray, ignore) => {
    // Skip if Redis is not connected
    if (!isRedisConnected()) {
        console.log('Redis not available - skipping global alert save')
        return
    }

    try {
        for (let userId of userIdsArray) {  
            if (userId == ignore.toString()) { continue }
            const jsonMessageLog = await client.HGET('globalAlerts', userId.toString())
            const messageLog = jsonMessageLog ? JSON.parse(jsonMessageLog) : []
            await client.HSET('globalAlerts', userId.toString(), JSON.stringify([ ...messageLog, data ]))
        }
    } catch (error) {
        console.log("saveGlobalAlertToRedis error", error.message)
        // Don't throw - Redis errors shouldn't break the application
    }
}

module.exports = { saveGlobalAlertToRedis }