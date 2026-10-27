const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// السماح بالاتصال من الموقع
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const GUILD_ID = '1559486326456193054';
const VERIFIED_ROLE_ID = '1564644997108867153';
const LOG_CHANNEL_ID = '1564672503484260522'; 

client.once('ready', () => {
    console.log(`✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
});

app.post('/verify-student', async (req, res) => {
    const { fullName, studentId, courseName, discordId } = req.body;

    if (!fullName || !studentId || !courseName || !discordId) {
        return res.status(400).json({ success: false, message: 'الرجاء إدخال كافة البيانات المطلوبة!' });
    }

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(discordId);

        if (!member) {
            return res.status(404).json({ success: false, message: 'لم يتم العثور على العضو داخل السيرفر! تأكد من أيدي ديسكورد.' });
        }

        // 1. إعطاء الرتبة للعضو
        await member.roles.add(VERIFIED_ROLE_ID);

        // 2. إرسال معلومات الطالب إلى الروم المحدد
        const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎓 توثيق طالب جديد ناجح')
                .setDescription('تم استلام بيانات الطالب وإعطاؤه رتبة المادة بنجاح.')
                .addFields(
                    { name: '👤 الاسم الكامل:', value: `\`${fullName}\``, inline: false },
                    { name: '🔢 الرقم الأكاديمي:', value: `\`${studentId}\``, inline: true },
                    { name: '📚 اسم المادة:', value: `\`${courseName}\``, inline: true },
                    { name: '🆔 معرف ديسكورد:', value: `<@${discordId}> (\`${discordId}\`)`, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'بوابة توثيق أمن الشبكات', iconURL: client.user.displayAvatarURL() });

            await logChannel.send({ embeds: [embed] });
        }

        console.log(`🎓 تم توثيق الطالب: ${fullName} | الرقم: ${studentId} | المادة: ${courseName}`);
        return res.json({ success: true, message: `مرحباً ${fullName}، تم توثيقك بنجاح!` });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'حدث خطأ أثناء إعطاء الرتبة، تأكد من صلاحيات البوت وأيدي الروم.' });
    }
});

app.listen(3000, () => {
    console.log('🚀 السيرفر شغال ويفحص على البورت: 3000');
});

client.login(process.env.TOKEN);