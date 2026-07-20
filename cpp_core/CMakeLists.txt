cmake_minimum_required(VERSION 3.15)
project(LiveRiskEngine)

# Find Python and Pybind11
find_package(Python COMPONENTS Interpreter Development REQUIRED)
add_subdirectory(pybind11) 

pybind11_add_module(risk_engine LiveRiskEngine.cpp)
