import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const mainDir = path.join(androidDir, 'app', 'src', 'main');
const resDir = path.join(mainDir, 'res');

if (!fs.existsSync(androidDir)) {
  console.error('Android project folder not found. Run "npx cap add android" first.');
  process.exit(1);
}

// 1. Configure minimal required permissions in AndroidManifest.xml
const manifestPath = path.join(mainDir, 'AndroidManifest.xml');
const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Optional network access for web font loading (core PDF engine works 100% offline) -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Camera access for Camera to PDF scanning (optional hardware feature so non-camera devices still install) -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Gallery image selection: Android 13+ uses Photo Picker / READ_MEDIA_IMAGES; legacy fallback for Android 8-12 -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
`;
fs.writeFileSync(manifestPath, manifestContent, 'utf8');

// 2. Ensure FileProvider paths allow sharing exported PDFs from cache, files, and external Documents
const xmlDir = path.join(resDir, 'xml');
fs.mkdirSync(xmlDir, { recursive: true });
const filePathsXml = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <cache-path name="my_cache_images" path="." />
    <files-path name="my_files" path="." />
    <external-files-path name="my_external_files" path="." />
</paths>
`;
fs.writeFileSync(path.join(xmlDir, 'file_paths.xml'), filePathsXml, 'utf8');

// 3. Configure Android brand colors (Royal Blue #536DFE, Red #E52535, crisp status/nav bars)
const valuesDir = path.join(resDir, 'values');
const valuesNightDir = path.join(resDir, 'values-night');
fs.mkdirSync(valuesDir, { recursive: true });
fs.mkdirSync(valuesNightDir, { recursive: true });

const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#536DFE</color>
    <color name="colorPrimaryDark">#3D5AFE</color>
    <color name="colorAccent">#E52535</color>
    <color name="statusBarBackground">#FFFFFF</color>
    <color name="navigationBarBackground">#FFFFFF</color>
    <color name="windowBackground">#FFFFFF</color>
</resources>
`;
fs.writeFileSync(path.join(valuesDir, 'colors.xml'), colorsXml, 'utf8');

const colorsNightXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#536DFE</color>
    <color name="colorPrimaryDark">#3D5AFE</color>
    <color name="colorAccent">#E52535</color>
    <color name="statusBarBackground">#0B1120</color>
    <color name="navigationBarBackground">#0F172A</color>
    <color name="windowBackground">#0B1120</color>
</resources>
`;
fs.writeFileSync(path.join(valuesNightDir, 'colors.xml'), colorsNightXml, 'utf8');

// 4. Configure Light & Night themes with proper status bar & navigation bar colors and icon contrast
const stylesLightXml = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:windowBackground">@color/windowBackground</item>
        <item name="android:statusBarColor">@color/statusBarBackground</item>
        <item name="android:navigationBarColor">@color/navigationBarBackground</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">true</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:windowBackground">@color/windowBackground</item>
        <item name="android:statusBarColor">@color/statusBarBackground</item>
        <item name="android:navigationBarColor">@color/navigationBarBackground</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">true</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
        <item name="android:statusBarColor">@color/statusBarBackground</item>
        <item name="android:navigationBarColor">@color/navigationBarBackground</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">true</item>
    </style>
</resources>
`;
fs.writeFileSync(path.join(valuesDir, 'styles.xml'), stylesLightXml, 'utf8');

const stylesNightXml = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="AppTheme" parent="Theme.AppCompat.DayNight.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:windowBackground">@color/windowBackground</item>
        <item name="android:statusBarColor">@color/statusBarBackground</item>
        <item name="android:navigationBarColor">@color/navigationBarBackground</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">false</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:windowBackground">@color/windowBackground</item>
        <item name="android:statusBarColor">@color/statusBarBackground</item>
        <item name="android:navigationBarColor">@color/navigationBarBackground</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">false</item>
    </style>

    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
        <item name="android:statusBarColor">@color/statusBarBackground</item>
        <item name="android:navigationBarColor">@color/navigationBarBackground</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">false</item>
    </style>
</resources>
`;
fs.writeFileSync(path.join(valuesNightDir, 'styles.xml'), stylesNightXml, 'utf8');

// 5. Ensure strings.xml has exact application name "PDF Maker" and package "com.pdfmaker.app"
const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PDF Maker</string>
    <string name="title_activity_main">PDF Maker</string>
    <string name="package_name">com.pdfmaker.app</string>
    <string name="custom_url_scheme">com.pdfmaker.app</string>
</resources>
`;
fs.writeFileSync(path.join(valuesDir, 'strings.xml'), stringsXml, 'utf8');

// 6. Enforce minSdkVersion >= 26 (Android 8.0) in android/variables.gradle when present
const varsGradlePath = path.join(androidDir, 'variables.gradle');
if (fs.existsSync(varsGradlePath)) {
  const varsText = fs.readFileSync(varsGradlePath, 'utf8');
  const updatedVars = varsText.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 26');
  fs.writeFileSync(varsGradlePath, updatedVars, 'utf8');
}

console.log('Configured Android manifest permissions, FileProvider paths, status/navigation bar themes, app name, and minSdkVersion=26.');
