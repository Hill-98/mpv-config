//
// https://github.com/mpv-player/mpv/wiki/User-Scripts#user-shaders
// https://libplacebo.org/custom-shaders/
//

//!HOOK LUMA
//!HOOK RGB
//!BIND HOOKED

vec4 hook()
{
    vec4 color = HOOKED_texOff(0);
    color.rgb = vec3(1.0) - color.rgb;
    return color;
}

