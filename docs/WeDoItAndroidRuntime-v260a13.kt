package app.wedoit.nativebridge

import android.Manifest
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.provideContent
import androidx.glance.text.Text
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf

/** Reference scaffold only: this file was not compiled in alpha13. */
object WeDoItNotificationGate {
    val stableChannelIds = setOf("action", "direct-social", "general-social", "active-session", "system")

    fun canPost(context: Context, channelId: String): Boolean {
        if (channelId !in stableChannelIds) return false
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(
                context, Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED) return false
        val manager = context.getSystemService(NotificationManager::class.java)
        val channelEnabled = Build.VERSION.SDK_INT < 26 || manager.getNotificationChannel(channelId)?.importance != NotificationManager.IMPORTANCE_NONE
        return channelEnabled && NotificationManagerCompat.from(context).areNotificationsEnabled()
    }
}

class WeDoItBootRestoreReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        // No network and no notification here. Reconcile persisted, user-approved schedules in a worker.
        val request = OneTimeWorkRequestBuilder<WeDoItReminderReconcileWorker>().build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            "wedoit-reminder-reconcile-after-boot",
            ExistingWorkPolicy.KEEP,
            request
        )
    }
}

class WeDoItReminderReconcileWorker(context: Context, params: WorkerParameters) :
    androidx.work.CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        // Fail closed until the native repository is integrated. Never claim boot recovery from this scaffold.
        return Result.failure(workDataOf("reason" to "native-reminder-repository-not-integrated"))
    }
}

class WeDoItWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent { Text("위두잇 · 앱에서 다음 행동 보기") }
    }
}

class WeDoItWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = WeDoItWidget()
}
