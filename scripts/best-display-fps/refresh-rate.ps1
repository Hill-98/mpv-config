Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class Monitor
{
    enum DISP_CHANGE : int
    {
        Successful = 0,
        Restart = 1,
        Failed = -1,
        BadMode = -2,
        NotUpdated = -3,
        BadFlags = -4,
        BadParam = -5,
        BadDualView = -6
    }

    enum ScreenOrientation : int
    {
        Angle0 = 0,
        Angle90 = 1,
        Angle180 = 2,
        Angle270 = 3
    }

    [StructLayout(LayoutKind.Sequential)]
    struct DEVMODE
    {
        private const int CCHDEVICENAME = 0x20;
        private const int CCHFORMNAME = 0x20;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 0x20)]
        public string dmDeviceName;
        public short dmSpecVersion;
        public short dmDriverVersion;
        public short dmSize;
        public short dmDriverExtra;
        public int dmFields;
        public int dmPositionX;
        public int dmPositionY;
        public ScreenOrientation dmDisplayOrientation;
        public int dmDisplayFixedOutput;
        public short dmColor;
        public short dmDuplex;
        public short dmYResolution;
        public short dmTTOption;
        public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 0x20)]
        public string dmFormName;
        public short dmLogPixels;
        public int dmBitsPerPel;
        public int dmPelsWidth;
        public int dmPelsHeight;
        public int dmDisplayFlags;
        public int dmDisplayFrequency;
        public int dmICMMethod;
        public int dmICMIntent;
        public int dmMediaType;
        public int dmDitherType;
        public int dmReserved1;
        public int dmReserved2;
        public int dmPanningWidth;
        public int dmPanningHeight;
    }

    [DllImport("user32.dll", CharSet = CharSet.Ansi)]
    static extern DISP_CHANGE ChangeDisplaySettings(ref DEVMODE lpDevMode, uint dwFlags);

    [DllImport("user32.dll", CharSet = CharSet.Ansi)]
    static extern bool EnumDisplaySettings(string lpszDeviceName, int iModeNum, ref DEVMODE lpDevMode);

    public static bool ChangeRefreshRate(string deviceName, int refreshRate)
    {
        var mode = new DEVMODE();
        if (EnumDisplaySettings(deviceName, -1, ref mode))
        {
            mode.dmDisplayFrequency = refreshRate;
            return ChangeDisplaySettings(ref mode, 0) == DISP_CHANGE.Successful;
        }
        else
        {
            return false;
        }
    }

    public static int GetCurrentRefreshRate(string deviceName)
    {
        var mode = new DEVMODE();
        if (EnumDisplaySettings(deviceName, -1, ref mode))
        {
            return mode.dmDisplayFrequency;
        }
        else
        {
            return 0;
        }
    }

    public static int[] GetRefreshRates(string deviceName)
    {
        var results = new List<int>();
        var mode = new DEVMODE();
        if (!EnumDisplaySettings(deviceName, -1, ref mode))
        {
            return results.ToArray();
        }
        var height = mode.dmPelsHeight;
        var wdith = mode.dmPelsWidth;
        for (int i = 0; EnumDisplaySettings(deviceName, i, ref mode); i++)
        {
            var frequency = mode.dmDisplayFrequency;
            if (height == mode.dmPelsHeight && wdith == mode.dmPelsWidth && frequency > 0 && !results.Contains(frequency))
            {
                results.Add(frequency);
            }
        }
        return results.ToArray();
    }
}
"@

if ($args.Length -ne 2) {
    Exit 1
}

[string]$display = $args[0];
[int]$refreshRate = $args[1];

if ($refreshRate -eq 0) {
    [int]$current = [Monitor]::GetCurrentRefreshRate($display)
    [int[]]$supported = [Monitor]::GetRefreshRates($display)
    Write-Host "{`"current`":$current,`"supported`":[$(($supported) -join ",")]}"
}
else {
    [bool]$result = [Monitor]::ChangeRefreshRate($display, $refreshRate)
    Write-Host $result.ToString().ToLower()
}
